import Storex from '@worldbrain/storex'
import {
    browser,
    Alarms,
    Runtime,
    Commands,
    History,
    Storage,
    Tabs,
} from 'webextension-polyfill-ts'
import { URLNormalizer, normalizeUrl } from '@worldbrain/memex-url-utils'

import * as utils from './utils'
import NotifsBackground from '../notifications/background'
import { makeRemotelyCallable } from '../util/webextensionRPC'
import { StorageChangesManager } from '../util/storage-changes'
import { migrations } from './quick-and-dirty-migrations'
import { AlarmsConfig } from './alarms'
import { generateUserId } from 'src/analytics/utils'
import { STORAGE_KEYS } from 'src/analytics/constants'
import CopyPasterBackground from 'src/copy-paster/background'
import insertDefaultTemplates from 'src/copy-paster/background/default-templates'
import { OVERVIEW_URL } from 'src/constants'
import { READ_STORAGE_FLAG } from 'src/common-ui/containers/UpdateNotifBanner/constants'
import { ReadwiseBackground } from 'src/readwise-integration/background'

// TODO: pass these deps down via constructor
import {
    constants as blacklistConsts,
    blacklist,
} from 'src/blacklist/background'
import analytics from 'src/analytics'
import TabManagementBackground from 'src/tab-management/background'
import CustomListBackground from 'src/custom-lists/background'
import { ONBOARDING_QUERY_PARAMS } from 'src/overview/onboarding/constants'
import { SettingStore } from 'src/util/settings'
import { LocalExtensionSettings } from './types'

// TODO: clean this types mess up
class BackgroundScript {
    private utils: typeof utils
    private tabManagement: TabManagementBackground
    private localExtSettingStore: SettingStore<LocalExtensionSettings>
    private copyPasterBackground: CopyPasterBackground
    private customListsBackground: CustomListBackground
    private notifsBackground: NotifsBackground
    private storageChangesMan: StorageChangesManager
    private readwiseBackground: ReadwiseBackground
    private storageManager: Storex
    private urlNormalizer: URLNormalizer
    private storageAPI: Storage.Static
    private historyAPI: History.Static
    private runtimeAPI: Runtime.Static
    private commandsAPI: Commands.Static
    private alarmsAPI: Alarms.Static
    private tabsAPI: Tabs.Static
    private alarmsListener

    constructor({
        storageManager,
        notifsBackground,
        readwiseBackground,
        copyPasterBackground,
        customListsBackground,
        tabManagement,
        utilFns = utils,
        storageChangesMan,
        localExtSettingStore,
        urlNormalizer = normalizeUrl,
        storageAPI = browser.storage,
        historyAPI = browser.history,
        runtimeAPI = browser.runtime,
        commandsAPI = browser.commands,
        alarmsAPI = browser.alarms,
        tabsAPI = browser.tabs,
    }: {
        storageManager: Storex
        tabManagement: TabManagementBackground
        notifsBackground: NotifsBackground
        copyPasterBackground: CopyPasterBackground
        customListsBackground: CustomListBackground
        readwiseBackground: ReadwiseBackground
        localExtSettingStore: SettingStore<LocalExtensionSettings>
        urlNormalizer?: URLNormalizer
        utilFns?: typeof utils
        storageChangesMan: StorageChangesManager
        storageAPI?: Storage.Static
        historyAPI?: History.Static
        runtimeAPI?: Runtime.Static
        commandsAPI?: Commands.Static
        alarmsAPI?: Alarms.Static
        tabsAPI?: Tabs.Static
    }) {
        this.storageManager = storageManager
        this.tabManagement = tabManagement
        this.notifsBackground = notifsBackground
        this.copyPasterBackground = copyPasterBackground
        this.customListsBackground = customListsBackground
        this.readwiseBackground = readwiseBackground
        this.utils = utilFns
        this.storageChangesMan = storageChangesMan
        this.storageAPI = storageAPI
        this.historyAPI = historyAPI
        this.runtimeAPI = runtimeAPI
        this.commandsAPI = commandsAPI
        this.alarmsAPI = alarmsAPI
        this.tabsAPI = tabsAPI
        this.urlNormalizer = urlNormalizer
        this.localExtSettingStore = localExtSettingStore
    }

    get defaultUninstallURL() {
        return process.env.NODE_ENV === 'production'
            ? 'https://us-central1-worldbrain-1057.cloudfunctions.net/uninstall'
            : 'https://us-central1-worldbrain-staging.cloudfunctions.net/uninstall'
    }

    /**
     * Set up custom commands defined in the manifest.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/commands
     */
    private setupCommands() {
        this.commandsAPI.onCommand.addListener((command) => {
            switch (command) {
                case 'openOverview':
                    return this.utils.openOverview()
                default:
            }
        })
    }

    private async runOnboarding() {
        await this.tabsAPI.create({
            url: `${OVERVIEW_URL}?${ONBOARDING_QUERY_PARAMS.NEW_USER}`,
        })
    }

    private async handleInstallLogic() {
        // Ensure default blacklist entries are stored (before doing anything else)
        await blacklist.addToBlacklist(blacklistConsts.DEF_ENTRIES)

        analytics.trackEvent({ category: 'Global', action: 'installExtension' })

        await this.runOnboarding()

        // Store the timestamp of when the extension was installed
        await this.localExtSettingStore.set('installTimestamp', Date.now())
        await insertDefaultTemplates({
            copyPaster: this.copyPasterBackground,
            localStorage: this.storageAPI.local,
        })
    }

    private async handleUpdateLogic() {
        if (process.env['SKIP_UPDATE_NOTIFICATION'] !== 'true') {
            await this.storageAPI.local.set({ [READ_STORAGE_FLAG]: false })
        }

        await insertDefaultTemplates({
            copyPaster: this.copyPasterBackground,
            localStorage: this.storageAPI.local,
        })
    }

    /**
     * Runs on both extension update and install.
     */
    private async handleUnifiedLogic() {
        await this.customListsBackground.createInboxListIfAbsent()
        await this.notifsBackground.deliverStaticNotifications()
        await this.tabManagement.trackExistingTabs()
    }

    /**
     * Set up logic that will get run on ext install, update, browser update.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
     */
    private setupInstallHooks() {
        this.runtimeAPI.onInstalled.addListener(async (details) => {
            switch (details.reason) {
                case 'install':
                    await this.handleUnifiedLogic()
                    return this.handleInstallLogic()
                case 'update':
                    await this.runQuickAndDirtyMigrations()
                    await this.handleUnifiedLogic()
                    return this.handleUpdateLogic()
                default:
            }
        })
    }

    private setupStartupHooks() {
        this.runtimeAPI.onStartup.addListener(async () => {
            this.tabManagement.trackExistingTabs()
        })
    }

    /**
     * Run all the quick and dirty migrations we have set up to run directly on Dexie.
     */
    private async runQuickAndDirtyMigrations() {
        for (const [storageKey, migration] of Object.entries(migrations)) {
            const storage = await this.storageAPI.local.get(storageKey)

            if (storage[storageKey]) {
                continue
            }

            await migration({
                storex: this.storageManager,
                db: this.storageManager.backend['dexieInstance'],
                localStorage: this.storageAPI.local,
                normalizeUrl: this.urlNormalizer,
                backgroundModules: {
                    readwise: this.readwiseBackground,
                },
            })
            await this.storageAPI.local.set({ [storageKey]: true })
        }
    }

    /**
     * Set up URL to open on extension uninstall.
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/setUninstallURL
     */
    private setupUninstallURL() {
        this.runtimeAPI.setUninstallURL(this.defaultUninstallURL)
        setTimeout(async () => {
            const userId = await generateUserId({ storage: this.storageAPI })
            this.runtimeAPI.setUninstallURL(
                `${this.defaultUninstallURL}?user=${userId}`,
            )
        }, 1000)

        this.storageChangesMan.addListener(
            'local',
            STORAGE_KEYS.USER_ID,
            ({ newValue }) =>
                this.runtimeAPI.setUninstallURL(
                    `${this.defaultUninstallURL}?user=${newValue}`,
                ),
        )
    }

    sendNotification(notifId: string) {
        return this.notifsBackground.dispatchNotification(notifId)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            openOverviewTab: this.utils.openOverviewURL,
            openOptionsTab: this.utils.openOptionsURL,
            openLearnMoreTab: this.utils.openLearnMoreURL,
        })
    }

    setupWebExtAPIHandlers() {
        this.setupInstallHooks()
        this.setupStartupHooks()
        this.setupCommands()
        this.setupUninstallURL()
    }

    setupAlarms(alarms: AlarmsConfig) {
        const alarmListeners = new Map()

        for (const [name, { listener, ...alarmInfo }] of Object.entries(
            alarms,
        )) {
            this.alarmsAPI.create(name, alarmInfo)
            alarmListeners.set(name, listener)
        }

        this.alarmsListener = ({ name }) => {
            const listener = alarmListeners.get(name)
            if (typeof listener === 'function') {
                listener(this)
            }
        }

        this.alarmsAPI.onAlarm.addListener(this.alarmsListener)
    }

    clearAlarms() {
        this.alarmsAPI.clearAll()
        this.alarmsAPI.onAlarm.removeListener(this.alarmsListener)
    }
}

export { utils }
export default BackgroundScript
