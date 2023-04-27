interface PythonVersion {
    version: string;
    pipPath: string;
    pythonPath: string;
    runtime: string;
    discontinueDate?: Date;
}
export declare function getLatestPythonVersion({ isDev, }: {
    isDev?: boolean;
}): PythonVersion;
export declare function getSupportedPythonVersion({ isDev, pipLockPythonVersion, }: {
    isDev?: boolean;
    pipLockPythonVersion: string | undefined;
}): PythonVersion;
export {};
