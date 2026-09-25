import { describe, expect, it } from 'vitest';
import {
    BUSINESS_SEARCH_DEFAULT_LIMIT,
    BUSINESS_SEARCH_MAX_LIMIT,
    chapterDetailsSchema,
    escapeLike,
    parseBusinessSearchParams,
    subsidySearchSchema,
} from '../validation';

const params = (q: Record<string, string>) => parseBusinessSearchParams(new URLSearchParams(q));

describe('escapeLike', () => {
    it('escapes LIKE wildcards and backslashes', () => {
        expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
    });

    it('leaves normal text untouched', () => {
        expect(escapeLike('Friseur')).toBe('Friseur');
    });
});

describe('parseBusinessSearchParams', () => {
    it('requires a query', () => {
        expect(params({})).toEqual({ ok: false, error: 'query is required' });
        expect(params({ q: '   ' })).toEqual({ ok: false, error: 'query is required' });
    });

    it('rejects overly long queries', () => {
        expect(params({ q: 'a'.repeat(101) }).ok).toBe(false);
    });

    it('uses the default limit and caps large limits', () => {
        expect(params({ q: 'x' })).toMatchObject({ ok: true, limit: BUSINESS_SEARCH_DEFAULT_LIMIT });
        expect(params({ q: 'x', limit: '10000000' })).toMatchObject({ limit: BUSINESS_SEARCH_MAX_LIMIT });
        expect(params({ q: 'x', limit: '-5' })).toMatchObject({ limit: 1 });
        expect(params({ q: 'x', limit: 'abc' })).toMatchObject({ limit: BUSINESS_SEARCH_DEFAULT_LIMIT });
    });

    it('accepts numeric district ids only', () => {
        expect(params({ q: 'x', districtId: '01' })).toMatchObject({ ok: true, districtId: '01' });
        expect(params({ q: 'x', districtId: "1' OR 1=1" })).toEqual({ ok: false, error: 'Invalid districtId' });
    });
});

describe('server action schemas', () => {
    it('rejects non-string and oversized chapter input', () => {
        expect(chapterDetailsSchema.safeParse({ district: 'Mitte', chapter: '1200' }).success).toBe(true);
        expect(chapterDetailsSchema.safeParse({ district: 1, chapter: '1200' }).success).toBe(false);
        expect(chapterDetailsSchema.safeParse({ district: 'x'.repeat(201), chapter: '1' }).success).toBe(false);
    });

    it('bounds the subsidy search limit', () => {
        const base = { query: '', district: 'Mitte' };
        expect(subsidySearchSchema.safeParse({ ...base, limit: -1 }).success).toBe(true);
        expect(subsidySearchSchema.safeParse({ ...base, limit: 100000 }).success).toBe(false);
        expect(subsidySearchSchema.safeParse({ ...base, limit: 1.5 }).success).toBe(false);
        expect(subsidySearchSchema.safeParse({ ...base, limit: 10, recipient: Array(101).fill('a') }).success).toBe(false);
    });
});
