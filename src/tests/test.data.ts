import path from 'path'
import type { MemexPDFMetadata } from 'src/page-analysis/background/content-extraction/types'
export const TEST_PDF_PATH = path.resolve(__dirname, 'test.pdf')
export const TEST_PDF_PAGE_TEXTS = [
    'What a wonderful PDF test monkey with banana!',
]

export const TEST_PDF_METADATA: MemexPDFMetadata = {
    memexTotalPages: 1,
    memexIncludedPages: 1,
    documentInformationDict: {
        IsAcroFormPresent: false,
        IsCollectionPresent: false,
        IsLinearized: false,
        IsSignaturesPresent: false,
        IsXFAPresent: false,
        PDFFormatVersion: '1.4',
        Producer: 'Skia/PDF m93 Google Docs Renderer',
        Title: 'test',
    },
    fingerprints: ['finger-one', 'finger-two'],
}
