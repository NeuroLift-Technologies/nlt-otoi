"""Port of ``@neurolift-technologies/otoi`` ``test/honor.test.ts`` to pytest.

The charter/document objects are copied verbatim from the TypeScript suite, so
the Python honoring layer must produce the same effective policy, tier order, and
conflict set the reference does — the cross-implementation conformance gate for
the orchestration layer.
"""
from __future__ import annotations

import json

import pytest
from nlt_toi import ToiValidationError, generate_key_pair, sign_toi

from nlt_otoi import (
    HonorOptions,
    ToiDocument,
    detect_conflicts,
    honor,
    parse_charter,
    propagate,
)

personal: ToiDocument = {
    "$toi": "1.0.0",
    "$tier": "personal",
    "identity": {"author": "josh"},
    "communication": {"tone": "direct"},
}

project: ToiDocument = {
    "$toi": "1.0.0",
    "$tier": "project",
    "identity": {"author": "nlt-redteam"},
    "communication": {"tone": "professional", "verbosity": "concise"},
}

charter = {
    "$otoi": "1.0.0",
    "agents": [{"id": "research-agent"}],
}


class TestHonor:
    def test_resolves_terminal_personal_precedence_and_project_gap_fill(self):
        policy = honor(charter, HonorOptions(documents=[project, personal]))
        # personal is terminal for tone; project only fills the gap (verbosity).
        assert policy.effective["communication"]["tone"] == "direct"
        assert policy.effective["communication"]["verbosity"] == "concise"
        assert policy.tiers == ["personal", "project"]
        assert policy.conflicts == []

    def test_requires_at_least_one_document(self):
        with pytest.raises(Exception, match=r"at least one .toi document"):
            honor(charter, HonorOptions())

    def test_loads_uri_backed_sources_via_load_source(self):
        with_source = {
            "$otoi": "1.0.0",
            "toi_sources": [{"tier": "personal", "uri": "me.toi"}],
        }
        policy = honor(
            with_source,
            HonorOptions(load_source=lambda uri: json.dumps(personal)),
        )
        assert policy.effective["identity"]["author"] == "josh"

    def test_rejects_uri_source_when_no_loader_supplied(self):
        with_source = {
            "$otoi": "1.0.0",
            "toi_sources": [{"tier": "personal", "uri": "me.toi"}],
        }
        with pytest.raises(Exception, match=r"no loadSource"):
            honor(with_source, HonorOptions())

    def test_rejects_source_whose_declared_tier_disagrees(self):
        mismatched = {
            "$otoi": "1.0.0",
            "toi_sources": [
                {
                    "tier": "personal",
                    "inline": {"$toi": "1.0.0", "$tier": "project", "identity": {"author": "x"}},
                }
            ],
        }
        with pytest.raises(Exception, match=r'declares tier "personal" but'):
            honor(mismatched, HonorOptions())

    def test_rejects_source_providing_both_uri_and_inline(self):
        both = {
            "$otoi": "1.0.0",
            "toi_sources": [
                {
                    "tier": "personal",
                    "uri": "me.toi",
                    "inline": {"$toi": "1.0.0", "$tier": "personal", "identity": {"author": "x"}},
                }
            ],
        }
        with pytest.raises(Exception, match=r"exactly one of"):
            parse_charter(both)


class TestDetectConflicts:
    def test_finds_same_tier_leaf_disagreements(self):
        # Same author (no conflict there); only `communication.tone` disagrees.
        a: ToiDocument = {
            "$toi": "1.0.0",
            "$tier": "project",
            "identity": {"author": "team"},
            "communication": {"tone": "formal"},
        }
        b: ToiDocument = {
            "$toi": "1.0.0",
            "$tier": "project",
            "identity": {"author": "team"},
            "communication": {"tone": "casual"},
        }
        conflicts = detect_conflicts([a, b])
        assert len(conflicts) == 1
        assert conflicts[0].path == "communication.tone"

    def test_does_not_treat_cross_tier_differences_as_conflicts(self):
        assert detect_conflicts([personal, project]) == []

    def test_on_conflict_reject_turns_same_tier_conflict_into_error(self):
        a: ToiDocument = {
            "$toi": "1.0.0",
            "$tier": "project",
            "identity": {"author": "a"},
            "communication": {"tone": "formal"},
        }
        b: ToiDocument = {
            "$toi": "1.0.0",
            "$tier": "project",
            "identity": {"author": "b"},
            "communication": {"tone": "casual"},
        }
        strict_charter = {"$otoi": "1.0.0", "enforcement": {"on_conflict": "reject"}}
        with pytest.raises(Exception, match=r"(?i)conflict"):
            honor(strict_charter, HonorOptions(documents=[a, b]))


class TestPropagate:
    def test_returns_effective_policy_for_declared_agent(self):
        policy = honor(charter, HonorOptions(documents=[personal]))
        assert propagate(policy, "research-agent") is policy.effective

    def test_refuses_unknown_agent_under_strict_enforcement(self):
        strict = {
            "$otoi": "1.0.0",
            "agents": [{"id": "known"}],
            "enforcement": {"mode": "strict"},
        }
        policy = honor(strict, HonorOptions(documents=[personal]))
        with pytest.raises(Exception, match=r"strict enforcement"):
            propagate(policy, "stranger")


class TestParseCharter:
    def test_rejects_non_object_root(self):
        with pytest.raises(Exception, match=r"must be a JSON object"):
            parse_charter("[]")

    def test_rejects_charter_missing_otoi(self):
        with pytest.raises(Exception, match=r"Invalid .otoi charter"):
            parse_charter({"agents": []})


def _with_rules(rules) -> ToiDocument:
    return {"$toi": "1.0.0", "$tier": "project", "identity": {"author": "team"}, "custom": {"rules": rules}}


class TestConsumesToiApis:
    """``.otoi`` consumes ``nlt_toi``: ``.toi`` validation, equality, and
    signature checks come from that package, not from a local copy. Mirrors the
    "consumes the @neurolift-technologies/toi APIs" block of the npm suite."""

    def test_compares_leaves_canonically_so_key_order_is_not_a_conflict(self):
        a = _with_rules([{"id": 1, "mode": "strict"}])
        b = _with_rules([{"mode": "strict", "id": 1}])
        assert detect_conflicts([a, b]) == []

    def test_treats_a_boolean_and_a_number_as_different_values(self):
        assert len(detect_conflicts([_with_rules(True), _with_rules(1)])) == 1

    def test_validates_host_supplied_documents_with_parse_toi(self):
        invalid = {"$toi": "not-semver", "$tier": "personal", "identity": {"author": "x"}}
        with pytest.raises(ToiValidationError):
            honor(charter, HonorOptions(documents=[invalid]))

    def test_rejects_host_supplied_document_whose_signature_does_not_verify(self):
        signed = sign_toi(personal, generate_key_pair().private_key)
        tampered = {**signed, "communication": {"tone": "friendly"}}
        with pytest.raises(Exception, match=r"signature"):
            honor(charter, HonorOptions(documents=[tampered]))

    def test_rejects_charter_source_whose_signature_does_not_verify(self):
        signed = sign_toi(personal, generate_key_pair().private_key)
        tampered = {**signed, "communication": {"tone": "friendly"}}
        with_source = {"$otoi": "1.0.0", "toi_sources": [{"tier": "personal", "inline": tampered}]}
        with pytest.raises(Exception, match=r"signature"):
            honor(with_source, HonorOptions())

    def test_honors_correctly_signed_documents_from_charter_and_host(self):
        private_key = generate_key_pair().private_key
        with_source = {
            "$otoi": "1.0.0",
            "toi_sources": [{"tier": "personal", "inline": sign_toi(personal, private_key)}],
        }
        policy = honor(with_source, HonorOptions(documents=[sign_toi(project, private_key)]))
        assert policy.effective["communication"]["tone"] == "direct"
        assert policy.effective["communication"]["verbosity"] == "concise"
