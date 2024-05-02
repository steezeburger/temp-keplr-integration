import { CelestiaChainInfo, AstriaChainInfo } from '../constants'
import { SigningStargateClient } from '@cosmjs/stargate'
import Long from 'long'

// @todo change this to the correct address (the sequencer bridge account.), currently set to a personal dev wallet.
const SEQUENCER = 'ria1p4z7yurh9ya3egqfld3xn6v4fyzph6qsq8w845'
const DENOM = 'utia'

export const sendIbcTransfer = async (
    sender: string,
    accountNumber: Long,
    recipient: string,
    bridge_amount: string
) => {
    if (window.keplr) {
        const keplr = window.keplr
        const key = await window.keplr.getKey(CelestiaChainInfo.chainId)
        const sourceChainId = CelestiaChainInfo.chainId
        const offlineSigner = keplr.getOfflineSigner(sourceChainId)

        if (keplr) {
            try {
                await keplr.experimentalSuggestChain(AstriaChainInfo)
            } catch (e) {
                if (e instanceof Error) {
                    console.log(e.message)
                }
            }
        }

        const client = await SigningStargateClient.connectWithSigner(
            CelestiaChainInfo.rpc,
            offlineSigner
        )
        const account = await client.getAccount(key.bech32Address)
        const memo = recipient
        const fee = {
            amount: [
                {
                    denom: DENOM,
                    amount: '0',
                },
            ],
            gas: '180000',
        }

        const msgIBCTransfer = {
            typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
            value: {
                sourcePort: 'transfer',
                sourceChannel: 'channel-84',
                token: {
                    denom: DENOM,
                    amount: bridge_amount,
                },
                sender: sender,
                receiver: SEQUENCER,
                // Timeout is in nanoseconds. Use Long.UZERO for default timeout
                timeoutTimestamp: Long.fromNumber(
                    Date.now() + 600_000
                ).multiply(1_000_000),
            },
        }

        // Sign and broadcast the transaction
        if (account) {
            const result = await client.signAndBroadcast(
                account.address,
                [msgIBCTransfer],
                fee,
                memo
            )
        } else {
            console.error('Account not found')
        }
    }
}
