"""Release topology contract: no provider writes or application data."""
import copy
import pathlib
import tomllib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
CONFIG = tomllib.loads((ROOT / "wrangler.toml").read_text(encoding="utf-8"))


def validate(config):
    assert config["name"] == "neuroped"
    assert config["pages_build_output_dir"] == "dist/public"
    assert config["compatibility_date"] == "2024-11-01"
    assert config["compatibility_flags"] == ["nodejs_compat"]
    assert config["vars"] == {
        "ENVIRONMENT": "production", "APP_NAME": "NeuroPed",
        "CLINICAL_LIVE_ENABLED": "true", "ESCUTA_ENABLED": "true",
    }
    assert config["ai"] == {"binding": "AI"}
    assert config["d1_databases"] == [{
        "binding": "DB", "database_name": "neuroped-db",
        "database_id": "9b0919e5-93af-4b4f-851b-fc77dc1e5bae",
    }]
    # Explicit empty array clears a stale dashboard binding at the next deploy.
    # Re-enabling metrics requires a deliberate, evidenced release contract change.
    assert config.get("analytics_engine_datasets") == []
    assert "durable_objects" not in config
    assert "env" not in config, "Environment overrides must be independently reviewed"


class ReleaseBindings(unittest.TestCase):
    def test_current_manifest(self):
        validate(CONFIG)

    def test_critical_bindings_cannot_disappear(self):
        for key in ["ai", "d1_databases", "vars", "compatibility_flags"]:
            with self.subTest(key=key):
                changed = copy.deepcopy(CONFIG)
                changed.pop(key)
                with self.assertRaises((AssertionError, KeyError)):
                    validate(changed)

    def test_implicit_or_unprovisioned_sink_cannot_return(self):
        for value in [None, [{"binding": "API_METRICS", "dataset": "neuroped_api_metrics"}]]:
            with self.subTest(value=value):
                changed = copy.deepcopy(CONFIG)
                if value is None:
                    changed.pop("analytics_engine_datasets")
                else:
                    changed["analytics_engine_datasets"] = value
                with self.assertRaises(AssertionError):
                    validate(changed)

    def test_database_and_live_mode_cannot_drift(self):
        for target in ["database", "live", "environment", "override"]:
            with self.subTest(target=target):
                changed = copy.deepcopy(CONFIG)
                if target == "database":
                    changed["d1_databases"][0]["database_id"] = "synthetic-wrong-database"
                elif target == "live":
                    changed["vars"]["CLINICAL_LIVE_ENABLED"] = "false"
                elif target == "environment":
                    changed["vars"]["ENVIRONMENT"] = "development"
                else:
                    changed["env"] = {"production": {}}
                with self.assertRaises(AssertionError):
                    validate(changed)


if __name__ == "__main__":
    unittest.main()
