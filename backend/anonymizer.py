import re
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

# Initialised once at module load
_analyzer = None
_anonymizer = None


def _get_engines():
    global _analyzer, _anonymizer
    if _analyzer is None:
        _analyzer = AnalyzerEngine()
        _anonymizer = AnonymizerEngine()
    return _analyzer, _anonymizer


def anonymize_cv(text: str, candidate_id: str) -> tuple[str, dict]:
    """
    Remove PII from CV text.
    Returns (anonymized_text, pii_dict) where pii_dict maps entity type -> list of values.
    """
    analyzer, anonymizer = _get_engines()

    results = analyzer.analyze(text=text, language="en")

    # Collect original PII values before anonymising
    pii: dict[str, list[str]] = {}
    for result in results:
        entity_type = result.entity_type
        value = text[result.start : result.end].strip()
        if not value:
            continue
        if entity_type not in pii:
            pii[entity_type] = []
        if value not in pii[entity_type]:
            pii[entity_type].append(value)

    operators = {
        "PERSON": OperatorConfig("replace", {"new_value": f"Candidate {candidate_id}"}),
        "EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "[email removed]"}),
        "PHONE_NUMBER": OperatorConfig("replace", {"new_value": "[phone removed]"}),
        "LOCATION": OperatorConfig("replace", {"new_value": "[address removed]"}),
        "URL": OperatorConfig("replace", {"new_value": "[url removed]"}),
        "DATE_TIME": OperatorConfig("keep"),  # keep dates (graduation year etc.)
    }

    anonymized = anonymizer.anonymize(
        text=text, analyzer_results=results, operators=operators
    )

    # Also strip any remaining email-like / phone-like patterns Presidio may miss
    clean = anonymized.text
    clean = re.sub(r"[\w.+-]+@[\w-]+\.[\w.]+", "[email removed]", clean)
    clean = re.sub(r"(\+?\d[\d\s\-().]{7,}\d)", "[phone removed]", clean)

    return clean, pii
