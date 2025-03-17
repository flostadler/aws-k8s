import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
export declare class BuildkitCerts extends pulumi.ComponentResource {
    /**
     * Returns true if the given object is an instance of BuildkitCerts.  This is designed to work even
     * when multiple copies of the Pulumi SDK have been loaded into the same process.
     */
    static isInstance(obj: any): obj is BuildkitCerts;
    readonly caCertPem: pulumi.Output<string>;
    readonly caCertPublicKeyPem: pulumi.Output<string>;
    readonly clientCertPem: pulumi.Output<string>;
    readonly clientPrivateKeyPem: pulumi.Output<string>;
    readonly serverCertPem: pulumi.Output<string>;
    readonly serverPrivateKeyPem: pulumi.Output<string>;
    /**
     * Create a BuildkitCerts resource with the given unique name, arguments, and options.
     *
     * @param name The _unique_ name of the resource.
     * @param args The arguments to use to populate this resource's properties.
     * @param opts A bag of options that control this resource's behavior.
     */
    constructor(name: string, args?: BuildkitCertsArgs, opts?: pulumi.ComponentResourceOptions);
}
/**
 * The set of arguments for constructing a BuildkitCerts resource.
 */
export interface BuildkitCertsArgs {
    caSubject?: pulumi.Input<inputs.SelfSignedCertSubjectArgs>;
    keyAlgorithm?: pulumi.Input<string>;
    serverDNSNames?: pulumi.Input<pulumi.Input<string>[]>;
    serverIPAddresses?: pulumi.Input<pulumi.Input<string>[]>;
}
