import {isSafeInteger} from 'lodash';

export const BoundaryOperatorList = [
    // long po first
    '>=', '<=', '>', '<', '=', '^', undefined,
] as const;

export type BoundaryOperator = typeof BoundaryOperatorList[number];

export type VersionBoundary = {
    version: InfiniteSemVer;
    operator: BoundaryOperator;
};

export type VersionRange = VersionBoundarySet[];

export type VersionBoundarySet = {
    lower?: VersionBoundary;
    upper?: VersionBoundary;
};

export type InfiniteSemVer = number[];

function isCharNumber(c: string) {
    return typeof c === 'string' && c.length == 1 && c >= '0' && c <= '9';
}

export function parseInfiniteSemVer(versionStr: string): VersionBoundary {
    console.log('parseInfiniteSemVer()', versionStr);
    let bo: BoundaryOperator = undefined;
    const bb = BoundaryOperatorList.filter(
        (T): T is Exclude<BoundaryOperator, undefined> => !!T
    ).find(op => versionStr.startsWith(op));
    if (bb) {
        bo = versionStr.substring(0, bb.length) as BoundaryOperator;
        versionStr = versionStr.substring(bb.length);
        bo = bb;
    }

    if (versionStr.length === 0 || !isCharNumber(versionStr[0])) {
        console.error('parseInfiniteSemVer() invalid versionStr', [versionStr, bb, bo]);
        return {
            version: [],
            operator: bo,
        };
    }

    const parts = versionStr.trim().split('.');
    const version: InfiniteSemVer = [];

    for (const part of parts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0) {
            // return null;
            break;
        }
        version.push(num);
    }
    if (version.length === 0) {
        version.push(0);
    }

    return {
        version,
        operator: bo,
    };
}

export function compareInfiniteVersions(a: InfiniteSemVer, b: InfiniteSemVer): number {
    const maxLength = Math.max(a.length, b.length);
    for (let i = 0; i < maxLength; i++) {
        const aValue = i < a.length ? a[i] : 0;
        const bValue = i < b.length ? b[i] : 0;

        if (aValue !== bValue) {
            return aValue - bValue;
        }
    }
    return 0;
}

export function parseVersionRange(rangeStr: string): VersionRange {
    const rangeSets =
        rangeStr.split(/\s*\|\|\s*/)
            .map(setStr => parseVersionBoundarySet(setStr))
            .filter((T): T is VersionBoundarySet => !!T);

    if (rangeSets.length === 0) {
        return [];
    }

    return rangeSets;
}

function parseVersionBoundarySet(setStr: string): VersionBoundarySet | null {
    const boundaries = setStr.split(/\s*&&\s*/);

    if (boundaries.length === 0 || boundaries.length > 2) {
        return null;
    }

    const boundarySet: VersionBoundarySet = {};

    for (const boundaryStr of boundaries) {
        const boundary = parseInfiniteSemVer(boundaryStr);
        if (boundary.version.length === 0) {
            return null;
        }

        switch (boundary.operator) {
            case '>':
            case '>=':
                if (boundarySet.lower) {
                    return null;
                }
                boundarySet.lower = boundary;
                break;

            case '<':
            case '<=':
                if (boundarySet.upper) {
                    return null;
                }
                boundarySet.upper = boundary;
                break;

            case '^': {
                if (boundarySet.lower || boundarySet.upper) {
                    return null;
                }
                boundarySet.lower = {version: boundary.version, operator: '>='};
                if (boundary.version[0] === 0) {
                    const c1 = boundary.version.length >= 2 ? boundary.version[1] + 1 : 1;
                    boundarySet.upper = {version: [0, c1], operator: '<'};
                } else if (boundary.version[0] > 0) {
                    const c0 = boundary.version[0] + 1;
                    boundarySet.upper = {version: [c0], operator: '<'};
                }
            }
                break;

            case '=':
            case undefined:
                if (boundarySet.lower || boundarySet.upper) {
                    return null;
                }
                boundarySet.lower = {version: boundary.version, operator: '>='};
                boundarySet.upper = {version: boundary.version, operator: '<='};
                break;
        }
    }

    return boundarySet;
}

export function isWithinRange(version: InfiniteSemVer, range: VersionRange): boolean {
    for (const boundarySet of range) {
        let isWithinBoundarySet = true;

        if (boundarySet.lower) {
            const comparison = compareInfiniteVersions(version, boundarySet.lower.version);
            console.log('comparison lower', [comparison, version, boundarySet.lower.version]);
            switch (boundarySet.lower.operator) {
                case '>':
                    if (comparison <= 0) isWithinBoundarySet = false;
                    break;
                case '>=':
                    if (comparison < 0) isWithinBoundarySet = false;
                    break;
            }
        }

        if (boundarySet.upper) {
            const comparison = compareInfiniteVersions(version, boundarySet.upper.version);
            console.log('comparison upper', [comparison, version, boundarySet.upper.version]);
            switch (boundarySet.upper.operator) {
                case '<':
                    if (comparison >= 0) isWithinBoundarySet = false;
                    break;
                case '<=':
                    if (comparison > 0) isWithinBoundarySet = false;
                    break;
            }
        }

        if (isWithinBoundarySet) {
            return true; // 如果版本在任何范围集内，则返回 true
        }
    }

    return false;
}

export const parseRange = parseVersionRange;
export const parseVersion = parseInfiniteSemVer;
export const satisfies = isWithinRange;

