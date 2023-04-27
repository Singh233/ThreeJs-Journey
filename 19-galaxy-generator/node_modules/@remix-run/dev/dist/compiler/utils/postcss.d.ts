import type { AcceptedPlugin, Processor } from "postcss";
import type { RemixConfig } from "../../config";
interface Options {
    config: RemixConfig;
    context?: RemixPostcssContext;
}
interface RemixPostcssContext {
    vanillaExtract: boolean;
}
export declare function loadPostcssPlugins({ config, context, }: Options): Promise<Array<AcceptedPlugin>>;
export declare function getPostcssProcessor({ config, context, }: Options): Promise<Processor | null>;
export {};
