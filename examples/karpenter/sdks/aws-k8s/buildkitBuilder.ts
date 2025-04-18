// *** WARNING: this file was generated by pulumi-language-nodejs. ***
// *** Do not edit by hand unless you're certain you know what you are doing! ***

import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
import * as utilities from "./utilities";

export class BuildkitBuilder extends pulumi.ComponentResource {
    /** @internal */
    public static readonly __pulumiType = 'aws-k8s:index:BuildkitBuilder';

    /**
     * Returns true if the given object is an instance of BuildkitBuilder.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    public static isInstance(obj: any): obj is BuildkitBuilder {
        if (obj === undefined || obj === null) {
            return false;
        }
        return obj['__pulumiType'] === BuildkitBuilder.__pulumiType;
    }


    /**
     * Create a BuildkitBuilder resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args: BuildkitBuilderArgs, opts?: pulumi.ComponentResourceOptions) {
        let resourceInputs: pulumi.Inputs = {};
        opts = opts || {};
        if (!opts.id) {
            if ((!args || args.caCertPem === undefined) && !opts.urn) {
                throw new Error("Missing required property 'caCertPem'");
            }
            if ((!args || args.certPem === undefined) && !opts.urn) {
                throw new Error("Missing required property 'certPem'");
            }
            if ((!args || args.privateKeyPem === undefined) && !opts.urn) {
                throw new Error("Missing required property 'privateKeyPem'");
            }
            resourceInputs["bottlerocket"] = args ? args.bottlerocket : undefined;
            resourceInputs["caCertPem"] = args ? args.caCertPem : undefined;
            resourceInputs["certPem"] = args ? args.certPem : undefined;
            resourceInputs["namespace"] = args ? args.namespace : undefined;
            resourceInputs["nodeSelector"] = args ? args.nodeSelector : undefined;
            resourceInputs["privateKeyPem"] = args ? args.privateKeyPem : undefined;
            resourceInputs["pvConfig"] = args ? args.pvConfig : undefined;
            resourceInputs["replicas"] = args ? args.replicas : undefined;
            resourceInputs["resources"] = args ? args.resources : undefined;
            resourceInputs["tolerations"] = args ? args.tolerations : undefined;
        } else {
        }
        opts = pulumi.mergeOptions(utilities.resourceOptsDefaults(), opts);
        super(BuildkitBuilder.__pulumiType, name, resourceInputs, opts, true /*remote*/);
    }
}

/**
 * The set of arguments for constructing a BuildkitBuilder resource.
 */
export interface BuildkitBuilderArgs {
    bottlerocket?: pulumi.Input<boolean>;
    caCertPem: pulumi.Input<string>;
    certPem: pulumi.Input<string>;
    namespace?: pulumi.Input<string>;
    nodeSelector?: pulumi.Input<{[key: string]: pulumi.Input<string>}>;
    privateKeyPem: pulumi.Input<string>;
    pvConfig?: pulumi.Input<inputs.PvConfigArgs>;
    replicas?: pulumi.Input<number>;
    resources?: pulumi.Input<inputs.ResourceRequirementsArgs>;
    tolerations?: pulumi.Input<inputs.TolerationArgs[]>;
}
