import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
export declare class BuildkitBuilder extends pulumi.ComponentResource {
    /**
     * Returns true if the given object is an instance of BuildkitBuilder.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is BuildkitBuilder;
    /**
     * Create a BuildkitBuilder resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: BuildkitBuilderArgs, opts?: pulumi.ComponentResourceOptions);
}
/**
 * The set of arguments for constructing a BuildkitBuilder resource.
 */
export interface BuildkitBuilderArgs {
    bottlerocket?: pulumi.Input<boolean>;
    caCertPem: pulumi.Input<string>;
    certPem: pulumi.Input<string>;
    namespace?: pulumi.Input<string>;
    nodeSelector?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    privateKeyPem: pulumi.Input<string>;
    pvConfig?: pulumi.Input<inputs.PvConfigArgs>;
    replicas?: pulumi.Input<number>;
    resources?: pulumi.Input<inputs.ResourceRequirementsArgs>;
    tolerations?: pulumi.Input<inputs.TolerationArgs[]>;
}
