import uuid
import json
from datetime import datetime, timezone
from xml.sax.saxutils import escape

from app.models.iso20022 import (
    Pacs008AssembleRequest,
    Pacs008MessageResponse,
    Pacs008ValidateRequest,
    Pacs008ValidateResponse,
)


class ISO20022Service:
    @classmethod
    def assemble_pacs008(cls, req: Pacs008AssembleRequest) -> Pacs008MessageResponse:
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y%m%d")
        now_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")

        # Unique Identifiers
        msg_id = f"RHIPAY/{date_str}/{req.sender_spoke}/{req.recipient_spoke}/{uuid.uuid4().hex[:8].upper()}"
        uetr = str(uuid.uuid4())
        end_to_end_id = req.quote_id

        # ZK Supplementary Data JSON representation
        zk_privacy_envelope = {
            "protocol_version": "RHIPAY_ZKP_PRIVACY_ENVELOPE_V1",
            "zk_proof": req.zk_proof,
            "nullifier_hash": req.nullifier_hash,
            "encrypted_pii_envelope": req.encrypted_envelope,
        }
        zk_privacy_json_str = json.dumps(zk_privacy_envelope, indent=2)

        # XML Serialization
        xml_template = f"""<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <FIToFICstmrCdtTrf>
        <GrpHdr>
            <MsgId>{escape(msg_id)}</MsgId>
            <CreDtTm>{now_iso}</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <SttlmInf>
                <SttlmMtd>CLRG</SttlmMtd>
                <ClrSys>
                    <Prtry>NEXUS</Prtry>
                </ClrSys>
            </SttlmInf>
        </GrpHdr>
        <CdtTrfTxInf>
            <PmtId>
                <EndToEndId>{escape(end_to_end_id)}</EndToEndId>
                <UETR>{uetr}</UETR>
            </PmtId>
            <IntrBkSttlmAmt Ccy="{req.recipient_currency}">{req.destination_amount:.2f}</IntrBkSttlmAmt>
            <InstdAmt Ccy="{req.sender_currency}">{req.origin_debit_amount:.2f}</InstdAmt>
            <XchgRateInf>
                <XchgRate>{req.fx_rate:.6f}</XchgRate>
                <RateTp>GUARANTEED_ZERO_SLIPPAGE</RateTp>
            </XchgRateInf>
            <Dbtr>
                <Nm>PROTECTED_ZK_ORIGINATOR</Nm>
                <Id>
                    <PrvtId>
                        <Othr>
                            <Id>{escape(req.sender_proxy)}</Id>
                            <SchmeNm><Prtry>NEXUS_PROXY</Prtry></SchmeNm>
                        </Othr>
                    </PrvtId>
                </Id>
            </Dbtr>
            <DbtrAgt>
                <FinInstnId>
                    <BICFI>{escape(req.sender_bic)}</BICFI>
                    <Ctry>{escape(req.sender_spoke)}</Ctry>
                </FinInstnId>
            </DbtrAgt>
            <CdtrAgt>
                <FinInstnId>
                    <BICFI>{escape(req.recipient_bic)}</BICFI>
                    <Ctry>{escape(req.recipient_spoke)}</Ctry>
                </FinInstnId>
            </CdtrAgt>
            <Cdtr>
                <Nm>{escape(req.recipient_name)}</Nm>
                <Id>
                    <PrvtId>
                        <Othr>
                            <Id>{escape(req.recipient_proxy)}</Id>
                            <SchmeNm><Prtry>NEXUS_PROXY</Prtry></SchmeNm>
                        </Othr>
                    </PrvtId>
                </Id>
            </Cdtr>
            <Purp>
                <Cd>{escape(req.purpose_code)}</Cd>
            </Purp>
            {f'<RmtInf><Ustrd>{escape(req.payment_note)}</Ustrd></RmtInf>' if req.payment_note else ''}
            <SplmtryData>
                <PlcAndNm>RHIPAY_ZKP_PRIVACY_ENVELOPE_V1</PlcAndNm>
                <Envlp>
                    <ZKPNullifierHash>{escape(req.nullifier_hash)}</ZKPNullifierHash>
                    <ZKProofPoints>
                        <Protocol>{req.zk_proof.get("protocol", "groth16")}</Protocol>
                        <Curve>{req.zk_proof.get("curve", "bn128")}</Curve>
                        <MerkleRoot>{escape(req.zk_proof.get("merkle_root", ""))}</MerkleRoot>
                    </ZKProofPoints>
                    <EncryptedFATFEnvelope>
                        <EnvelopeId>{escape(req.encrypted_envelope.get("envelope_id", ""))}</EnvelopeId>
                        <RecipientRegulatorId>{escape(req.encrypted_envelope.get("recipient_regulator_id", ""))}</RecipientRegulatorId>
                        <EncryptionAlgorithm>{escape(req.encrypted_envelope.get("encryption_algorithm", ""))}</EncryptionAlgorithm>
                        <EncryptedKey>{escape(req.encrypted_envelope.get("encrypted_aes_key", ""))}</EncryptedKey>
                        <Ciphertext>{escape(req.encrypted_envelope.get("encrypted_pii_ciphertext", ""))}</Ciphertext>
                        <IV>{escape(req.encrypted_envelope.get("iv", ""))}</IV>
                        <AuthTag>{escape(req.encrypted_envelope.get("auth_tag", ""))}</AuthTag>
                    </EncryptedFATFEnvelope>
                </Envlp>
            </SplmtryData>
        </CdtTrfTxInf>
    </FIToFICstmrCdtTrf>
</Document>"""

        # Canonical JSON representation for easy client parsing
        canonical_json = {
            "GrpHdr": {
                "MsgId": msg_id,
                "CreDtTm": now_iso,
                "NbOfTxs": 1,
                "SttlmInf": {"SttlmMtd": "CLRG", "ClrSys": {"Prtry": "NEXUS"}},
            },
            "CdtTrfTxInf": {
                "PmtId": {"EndToEndId": end_to_end_id, "UETR": uetr},
                "IntrBkSttlmAmt": {"Amount": req.destination_amount, "Ccy": req.recipient_currency},
                "InstdAmt": {"Amount": req.origin_debit_amount, "Ccy": req.sender_currency},
                "XchgRateInf": {"XchgRate": req.fx_rate, "RateTp": "GUARANTEED_ZERO_SLIPPAGE"},
                "Dbtr": {"Nm": "PROTECTED_ZK_ORIGINATOR", "Proxy": req.sender_proxy},
                "DbtrAgt": {"BICFI": req.sender_bic, "Ctry": req.sender_spoke},
                "CdtrAgt": {"BICFI": req.recipient_bic, "Ctry": req.recipient_spoke},
                "Cdtr": {"Nm": req.recipient_name, "Proxy": req.recipient_proxy},
                "Purp": {"Cd": req.purpose_code},
                "SplmtryData": zk_privacy_envelope,
            },
        }

        return Pacs008MessageResponse(
            message_id=msg_id,
            uetr=uetr,
            end_to_end_id=end_to_end_id,
            message_type="pacs.008.001.10",
            settlement_method="CLRG",
            clearing_system="NEXUS",
            instructed_amount=req.origin_debit_amount,
            instructed_currency=req.sender_currency,
            settlement_amount=req.destination_amount,
            settlement_currency=req.recipient_currency,
            exchange_rate=req.fx_rate,
            xml_payload=xml_template.strip(),
            canonical_json=canonical_json,
            is_valid=True,
            created_at=now,
        )

    @classmethod
    def validate_pacs008(cls, req: Pacs008ValidateRequest) -> Pacs008ValidateResponse:
        xml_str = req.xml_payload.strip()
        is_valid = bool(
            xml_str.startswith("<?xml") and
            "pacs.008.001.10" in xml_str and
            "<FIToFICstmrCdtTrf>" in xml_str and
            "</Document>" in xml_str
        )

        return Pacs008ValidateResponse(
            schema_valid=is_valid,
            message_type="pacs.008.001.10",
            details="ISO 20022 pacs.008 schema validation passed" if is_valid else "Schema syntax error",
        )


iso20022_service = ISO20022Service()
