import * as pulumi from "@pulumi/pulumi";
import * as tls from "@pulumi/tls";

export interface BuildkitCertsArgs {
    caSubject?: pulumi.Input<tls.types.input.SelfSignedCertSubject>;
    // The algorithm to use for the client/server certificates. Either "RSA" or "ECDSA".
    keyAlgorithm?: pulumi.Input<string>;
    serverIPAddresses?: pulumi.Input<pulumi.Input<string>[]>;
    serverDNSNames?: pulumi.Input<pulumi.Input<string>[]>;
}

export class BuildkitCerts extends pulumi.ComponentResource {
    public readonly caCertPublicKeyPem: pulumi.Output<string>;
    public readonly caCertPem: pulumi.Output<string>;
    public readonly serverCertPem: pulumi.Output<string>;
    public readonly serverPrivateKeyPem: pulumi.Output<string>;
    public readonly clientCertPem: pulumi.Output<string>;
    public readonly clientPrivateKeyPem: pulumi.Output<string>;

    constructor(name: string, args: BuildkitCertsArgs, opts?: pulumi.ComponentResourceOptions) {
        super("aws-k8s:buildkit:Certs", name, args, opts);

        const pk = new tls.PrivateKey(`${name}-ca-key`, {
            algorithm: "RSA",
            rsaBits: 3072,
        });

        this.caCertPublicKeyPem = pk.publicKeyPem;
            // certificate is valid for 800 days (2 years and 2 months), which is less than
            // 825 days, the limit that macOS/iOS apply to all certificates,
            // including custom roots. See https://support.apple.com/en-us/HT210176.
            // validityPeriodHours: 800 * 24,


        const ca = new tls.SelfSignedCert("ca", {
            privateKeyPem: pk.privateKeyPem,
            allowedUses: ["cert_signing"],
            validityPeriodHours: 10 * 365 * 24, // 10 years
            earlyRenewalHours: 90 * 24, // 90 days
            isCaCertificate: true,
            setSubjectKeyId: true,
            subject: args.caSubject ?? {
                commonName: "buildkit-ca",
                organization: "Buildkit development CA",
            },
        });

        const keyArgs = {
            algorithm: args.keyAlgorithm ?? "RSA",
            rsaBits: pulumi.output(args.keyAlgorithm).apply((algorithm) => {
                if (algorithm === "RSA") {
                    return 2048;
                }
                return undefined as any;
            }),
            ecdsaCurve: pulumi.output(args.keyAlgorithm).apply((algorithm) => {
                if (algorithm === "ECDSA") {
                    return "P256";
                }
                return undefined as any;
            }),
        };

        // Create server key and certificate
        const serverKey = new tls.PrivateKey(`${name}-server-key`, keyArgs);
        const serverCertRequest = new tls.CertRequest(`${name}-server-cert-request`, {
            privateKeyPem: serverKey.privateKeyPem,
            subject: {
                organization: "Buildkit development certificate",
            },
            dnsNames: args.serverDNSNames,
            ipAddresses: args.serverIPAddresses,
        });
        const serverCert = new tls.LocallySignedCert(`${name}-server-cert`, {
            caPrivateKeyPem: ca.privateKeyPem,
            caCertPem: ca.certPem,
            certRequestPem: serverCertRequest.certRequestPem,
            allowedUses: ["key_encipherment", "digital_signature", "server_auth"],
            validityPeriodHours: 800 * 24, // 800 days (compliant with Apple's limit)
        });

        // Create client key and certificate
        const clientKey = new tls.PrivateKey(`${name}-client-key`, keyArgs);
        const clientCertRequest = new tls.CertRequest(`${name}-client-cert-request`, {
            privateKeyPem: clientKey.privateKeyPem,
            subject: {
                organization: "Buildkit development certificate",
            },
        });
        const clientCert = new tls.LocallySignedCert(`${name}-client-cert`, {
            caPrivateKeyPem: ca.privateKeyPem,
            caCertPem: ca.certPem,
            certRequestPem: clientCertRequest.certRequestPem,
            allowedUses: ["key_encipherment", "digital_signature", "client_auth"],
            validityPeriodHours: 800 * 24, // 800 days (compliant with Apple's limit)
        });

        // Export the certificates and keys as class properties
        this.caCertPem = ca.certPem;
        this.serverCertPem = serverCert.certPem;
        this.serverPrivateKeyPem = serverKey.privateKeyPem;
        this.clientCertPem = clientCert.certPem;
        this.clientPrivateKeyPem = clientKey.privateKeyPem;

        // Register all resources
        this.registerOutputs({
            caCertPem: this.caCertPem,
            serverCertPem: this.serverCertPem,
            serverPrivateKeyPem: this.serverPrivateKeyPem,
            clientCertPem: this.clientCertPem,
            clientPrivateKeyPem: this.clientPrivateKeyPem,
        });
    }
}
