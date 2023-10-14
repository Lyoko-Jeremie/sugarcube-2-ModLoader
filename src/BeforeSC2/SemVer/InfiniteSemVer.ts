export const BoundaryOperatorList = [
    '>', '<', '>=', '<=', '=', '^', undefined,
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

export function infiniteSemVer(versionStr: string): VersionBoundary | null {
    let bo: BoundaryOperator = undefined;
    if (BoundaryOperatorList.filter(
        (T): T is Exclude<undefined, BoundaryOperator> => !!T
    ).find(op => versionStr.startsWith(op))) {
        bo = versionStr.substring(0, 2) as BoundaryOperator;
        versionStr = versionStr.substring(2);
    }

    const parts = versionStr.trim().split('.');
    const version: InfiniteSemVer = [];

    for (const part of parts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0) {
            return null;
        }
        version.push(num);
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

export function parseVersionRange(rangeStr: string): VersionRange | null {
    const rangeSets =
        rangeStr.split(/\s*\|\|\s*/)
            .map(setStr => parseVersionBoundarySet(setStr))
            .filter(Boolean) as VersionBoundarySet[];

    if (rangeSets.length === 0) {
        return null;
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
        const boundary = infiniteSemVer(boundaryStr);
        if (!boundary) {
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

            case '=':
            case '^':
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
