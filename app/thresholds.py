"""
Community Scam Map — Trust Thresholds & Configuration
Values calibrated and reconciled in Part 3 of the Design & Test Book.

When THRESHOLDS_APPROVED is False (default for demo/safe mode), the engine
runs in safe mode and returns SUSPICIOUS for reported indicators.
When THRESHOLDS_APPROVED is True, full Beta-Binomial scoring and HIGH_CONFIDENCE
(KNOWN_SCAM) promotions are enabled.
"""
import os
from dataclasses import dataclass

@dataclass(frozen=True)
class Thresholds:
    APPROVED: bool = False

    # Beta-Binomial prior
    alpha0: float = 0.5
    beta0:  float = 1.5

    # State promotions
    corr_min_clusters: int = 3
    corr_min_score: float = 0.55
    hc_min_clusters: int = 5
    hc_min_score: float = 0.75

    # Hysteresis
    demote_hc_to_corr: float = 0.65
    demote_corr_to_unv: float = 0.45

    # Dispute mass
    D_open: float = 2.0
    D_upheld: float = 4.0

    # Clustering & Campaign collapse
    net_window_hours: int = 6
    campaign_window_minutes: int = 120
    campaign_min_group: int = 4
    gamma_min: float = 0.70
    gamma_note_min: float = 0.60
    note_jaccard: float = 0.70
    note_template_jaccard: float = 0.85

    # Per-report weights
    note_base: float = 0.45
    note_len_scale: float = 0.55
    note_len_ref: int = 200
    note_junk: float = 0.15
    note_template_dup: float = 0.35
    q_type_unknown: float = 0.75
    q_ev_screenshot: float = 0.08
    q_ev_amount: float = 0.04
    q_ev_cap: float = 1.10
    q_t_1h: float = 1.00
    q_t_24h: float = 0.95
    q_t_7d: float = 0.85
    q_t_older: float = 0.60
    q_t_90d_multiplier: float = 0.50

    # Reputation bounds
    rho_base: float = 0.70
    rho_slope: float = 0.60
    rho_min: float = 0.70
    rho_max: float = 1.10

    # Alerts
    alert_trusted_w_floor: float = 0.40
    alert_spike_min_count: int = 5
    alert_spike_ratio: float = 2.0
    alert_net_diversity_min: int = 3
    alert_new_type_min_clusters: int = 3

    # Rate limits
    rl_rid_per_hour: int = 10
    rl_rid_per_day: int = 30
    rl_net_per_hour: int = 40

    # Expiry & Display
    expiry_days: int = 180
    expiry_score_floor: float = 0.50
    mask_below_reporters: int = 3

    # Backward-compatible property aliases
    @property
    def CLUSTER_NET_WINDOW_HOURS(self) -> int: return self.net_window_hours
    @property
    def RL_RID_PER_HOUR(self) -> int: return self.rl_rid_per_hour
    @property
    def RL_RID_PER_DAY(self) -> int: return self.rl_rid_per_day
    @property
    def RL_NET_PER_HOUR(self) -> int: return self.rl_net_per_hour
    @property
    def ALERT_NET_DIVERSITY_MIN(self) -> int: return self.alert_net_diversity_min
    @property
    def ALERT_SPIKE_MIN_COUNT(self) -> int: return self.alert_spike_min_count
    @property
    def ALERT_SPIKE_RATIO(self) -> float: return self.alert_spike_ratio
    @property
    def ALERT_TRUSTED_W_FLOOR(self) -> float: return self.alert_trusted_w_floor

# Global calibrated configuration singleton
CALIBRATED_CONFIG = Thresholds(APPROVED=True)

def load() -> Thresholds:
    approved = os.environ.get("THRESHOLDS_APPROVED", "false").lower() in ("true", "1", "yes")
    if not approved:
        return Thresholds(APPROVED=False)
    return CALIBRATED_CONFIG
