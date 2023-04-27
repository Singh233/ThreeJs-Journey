import { NodeVersion } from '../types';
export declare function getLatestNodeVersion(): {
    readonly major: 18;
    readonly range: "18.x";
    readonly runtime: "nodejs18.x";
};
export declare function getDiscontinuedNodeVersions(): NodeVersion[];
export declare function getSupportedNodeVersion(engineRange: string | undefined, isAuto?: boolean): Promise<NodeVersion>;
