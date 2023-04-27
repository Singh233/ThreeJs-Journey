/// <reference types="node" />
import { IncomingMessage } from 'http';
import { VercelProxyResponse } from '@vercel/node-bridge/types';
export declare function createServerlessEventHandler(entrypoint: string, options: {
    shouldAddHelpers: boolean;
    useRequire: boolean;
}): Promise<(request: IncomingMessage) => Promise<VercelProxyResponse>>;
