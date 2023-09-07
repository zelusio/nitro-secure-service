import fs from 'fs'
import * as toml from 'toml'
import AWS from 'aws-sdk'

console.log(`INFO | Attempting to upload PCRs to AWSSM...`)
// Arguments
// Read the TOML file name from the command line argument
const args = process.argv.slice(2)
const tomlFileName = args[0]
const secretName = args[1]
if (!tomlFileName) {
    console.error(`ERROR | No TOML file name provided`)
    process.exit(1)
}
console.log(`INFO | TOML file name: ${tomlFileName}`)

if (!secretName) {
    console.error(`ERROR | No AWSSM secret name provided`)
    process.exit(1)
}
console.log(`INFO | AWSSM secret name: ${secretName}`)

// Parse the TOML file and extract the PCRs, sanity check
const tomlFile = fs.readFileSync(tomlFileName, 'utf8')
console.log(`INFO | Read TOML file.`)
const attestationDoc = toml.parse(tomlFile)
console.log(`INFO | Parsed TOML file`)
console.log(`INFO | Attestation Document: ${JSON.stringify(attestationDoc?.attestation || {})}`)
if (
    !attestationDoc.attestation ||
    !attestationDoc.attestation.PCR0 ||
    !attestationDoc.attestation.PCR1 ||
    !attestationDoc.attestation.PCR2 ||
    !attestationDoc.attestation.PCR8
) {
    console.error(`Invalid attestation document - missing PCRs:`)
    console.log(attestationDoc)
    process.exit(1)
}

const prcs = {
    pcr0: attestationDoc.attestation.PCR0,
    pcr1: attestationDoc.attestation.PCR1,
    pcr2: attestationDoc.attestation.PCR2,
    pcr8: attestationDoc.attestation.PCR8
}
console.log(`INFO | Extracted PCRs: ${JSON.stringify(prcs)}`)

// Configure AWS SDK
console.log(`INFO | uploading them to AWSSM...`)
AWS.config.update({region: 'us-east-1'})
const secretsManager = new AWS.SecretsManager()

/**
 * @type {{SecretString: string, SecretId: string}}
 * @property {string} SecretString - the value to put in the AWSSM secret - should be a string (usu. stringified JSON)
 * @property {string} SecretId - the name of the AWSSM secret, e.g. `nitro-secure-service/dev/pcrs`
 */
const params = {
    SecretId: secretName,
    SecretString: JSON.stringify(prcs)
}

// Upload the PCRs to AWSSM, handling any errors
secretsManager.updateSecret(params, (err, data) => {
    if (err) {
        console.error(`ERROR | Failed to upload PCRs to AWSSM: ${err}`)
        console.error(err.stack)
        process.exit(1)
    }
    else {
        console.log(`INFO | Successfully uploaded PCRs to AWSSM!`)
        console.log(data)
        process.exit(1)
    }
})