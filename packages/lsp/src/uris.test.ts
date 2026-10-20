import { describe, expect, it } from 'bun:test';
import { fileUriKey, fileUriToPath, pathToFileUri } from './uris.ts';

describe('file URIs', () => {
    it('encodes each segment of a POSIX path and decodes it again', () => {
        const uri = pathToFileUri('/Users/bas/My Project/ü#1.ts');
        expect(uri).toBe('file:///Users/bas/My%20Project/%C3%BC%231.ts');
        expect(fileUriToPath(uri)).toBe('/Users/bas/My Project/ü#1.ts');
    });

    it('keeps the drive of a Windows path', () => {
        expect(pathToFileUri('C:\\work\\app.ts')).toBe('file:///C:/work/app.ts');
        expect(fileUriToPath('file:///C:/work/app.ts')).toBe('C:\\work\\app.ts');
    });

    it('reads nothing but file URIs', () => {
        expect(fileUriToPath('https://example.com/a.ts')).toBeNull();
        expect(fileUriToPath('not a uri')).toBeNull();
    });

    it('reads a URI that does not decode as no path rather than throwing', () => {
        expect(fileUriToPath('file:///tmp/%zz')).toBeNull();
    });

    it('keeps the server of a UNC path', () => {
        expect(pathToFileUri('\\\\server\\share\\a.ts')).toBe('file://server/share/a.ts');
        expect(fileUriToPath('file://server/share/a.ts')).toBe('\\\\server\\share\\a.ts');
        expect(fileUriToPath('file://localhost/tmp/a.ts')).toBe('/tmp/a.ts');
    });

    it('keeps a backslash in a POSIX file name', () => {
        const uri = pathToFileUri('/tmp/a\\b.ts');
        expect(uri).toBe('file:///tmp/a%5Cb.ts');
        expect(pathToFileUri('//tmp/a.ts')).toBe('file:////tmp/a.ts');
        expect(fileUriToPath(uri)).toBe('/tmp/a\\b.ts');
    });

    it('gives every way of writing a Windows drive one key, and leaves any other URI its own', () => {
        expect(fileUriKey('file:///c%3A/work/My%20App/a.ts')).toBe('file:///C:/work/My%20App/a.ts');
        expect(fileUriKey('file:///c:/work/a.ts')).toBe(fileUriKey('file:///C:/work/a.ts'));
        expect(fileUriKey('file:///Users/bas/a.ts')).toBe('file:///Users/bas/a.ts');
        expect(fileUriKey('untitled:1')).toBe('untitled:1');
    });
});
