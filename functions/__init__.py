"""
Functions package for the Financial Simulation system.
Contains all task functions, economic context, and simulation utilities.
"""

# Import commonly used functions for easier access
from .economic_context import EconomicEnvironment, simulate_monthly_market
from .monthly_simulation import deduplicate_and_save, assign_persona, generate_monthly_reflection_report
from .task_functions import (
    build_discipline_report_context,
    build_goal_status_context,
    build_behavior_tracker_context,
    build_karmic_tracker_context,
    build_financial_strategy_context
)
from .task_functions_fixed import build_simulated_cashflow_context

__all__ = [
    "EconomicEnvironment",
    "simulate_monthly_market",
    "deduplicate_and_save",
    "assign_persona", 
    "generate_monthly_reflection_report",
    "build_discipline_report_context",
    "build_goal_status_context",
    "build_behavior_tracker_context",
    "build_karmic_tracker_context",
    "build_financial_strategy_context",
    "build_simulated_cashflow_context"
]
