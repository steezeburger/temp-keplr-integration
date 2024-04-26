import React, {useEffect} from 'react';
import {getKeplrFromWindow} from "./util/getKeplrFromWindow";
import {CelestiaChainInfo} from "./constants";
import {Balances} from "./types/balance";
import {Dec, DecUtils} from "@keplr-wallet/unit";
import { sendIbcTransfer } from "./util/ibcTransfer";
import {api} from "./util/api";
import {simulateMsgs} from "./util/simulateMsgs";
import {MsgSend} from "./proto-types-gen/src/cosmos/bank/v1beta1/tx";
import "./styles/container.css";
import "./styles/button.css";
import "./styles/item.css";
import Long from "long";


function App() {
  const [address, setAddress] = React.useState<string>('');
  const [balance, setBalance] = React.useState<string>('');

  const [recipient, setRecipient] = React.useState<string>('');
  const [amount, setAmount] = React.useState<string>('');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const keplr = await getKeplrFromWindow();

    if(keplr) {
      try {
        await keplr.experimentalSuggestChain(CelestiaChainInfo);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }
    }
  }

  const getKeyFromKeplr = async () => {
    const key = await window.keplr?.getKey(CelestiaChainInfo.chainId);
    if (key) {
      setAddress(key.bech32Address)
    }
  }

  const getBalance = async () => {
    const key = await window.keplr?.getKey(CelestiaChainInfo.chainId);

    if (key) {
      const uri = `${CelestiaChainInfo.rest}/cosmos/bank/v1beta1/balances/${key.bech32Address}?pagination.limit=1000`;

      const data = await api<Balances>(uri);
      const balance = data.balances.find((balance) => balance.denom === "utia");
      const tiaDecimal = CelestiaChainInfo.currencies.find((currency) => currency.coinMinimalDenom === "utia")?.coinDecimals;

      if(balance) {
        const amount = new Dec(balance.amount, tiaDecimal);
        setBalance(`${amount.toString(tiaDecimal)} TIA`)
      } else {
        setBalance(`0 TIA`)
      }
    }
  }

  const sendBalance = async () => {

    if (window.keplr) {
      const key = await window.keplr.getKey(CelestiaChainInfo.chainId);
      console.log('key: ', key)
      const protoMsgs = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.encode({
          fromAddress: key.bech32Address,
          toAddress: recipient,
          amount: [
            {
              denom: "utia",
              amount: DecUtils.getTenExponentN(9).mul(new Dec(amount)).truncate().toString(),
            },
          ],
        }).finish(),
      }

      // @todo get this from keplr connected account?
      const accountNumber: Long = Long.fromString('0')


      try {
        // const gasUsed = await simulateMsgs(
        //   CelestiaChainInfo,
        //   key.bech32Address,
        //   [protoMsgs],
        //   [{denom: "utia",
        //     amount: "236",}]
        //   );

        // if(gasUsed) {
            await sendIbcTransfer(key.bech32Address, accountNumber, recipient, DecUtils.getTenExponentN(6).mul(new Dec(amount)).truncate().toString())
        // }

      } catch (e) {
        if (e instanceof Error) {
          console.log(e.message);
        }
      }

    }
  }


  return (
    <div className="root-container">
        <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "16px"
        }}>
          <img src="/keplr-logo.png" style={{maxWidth: "200px"}} alt="keplr-logo" />
        </div>



      <div className="item-container">
        <div className="item">
          <div className="item-title">
            Get TIA Address
          </div>

          <div className="item-content">
            <div>
              Address: {address}
            </div>

            <div>
              <button className="keplr-button" onClick={getKeyFromKeplr}>Get Address</button>
            </div>
          </div>
        </div>

        <div className="item">
          <div className="item-title">
            Get TIA Balance
          </div>

          <div className="item-content">
            Balance: {balance}

            <button className="keplr-button" onClick={getBalance}>Get Balance</button>
          </div>
        </div>

        <div className="item">
          <div className="item-title">
            Send TIA
          </div>

          <div className="item-content">
            <div style={{
              display: "flex",
              flexDirection: "column"
            }}>
              Recipient:
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column"
            }}>
              Amount:
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <button className="keplr-button" onClick={sendBalance}>Send</button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
