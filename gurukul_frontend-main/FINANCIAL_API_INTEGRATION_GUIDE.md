# Financial Simulation API Integration Guide

## Overview

This guide explains the updates made to the financial simulation API integration in the frontend codebase. The backend team has made significant updates to ensure the API accurately uses exact user inputs and produces consistent JSON output.

## API Endpoints

The financial simulation API provides the following endpoints:

1. **Start Simulation (Async)**: `/start-simulation` (POST)
   - Begins an asynchronous simulation process
   - Returns a task ID for tracking progress

2. **Check Simulation Status**: `/simulation-status/{task_id}` (GET)
   - Checks the current status of a simulation task
   - Returns status information like "queued", "running", "completed", or "failed"

3. **Get Simulation Results**: `/simulation-results/{task_id}` (GET)
   - Retrieves the results of a completed or in-progress simulation
   - Returns partial or complete results based on simulation progress

4. **Get Real-time Updates**: `/simulation-results/{task_id}/updates` (GET)
   - Retrieves real-time updates during simulation processing
   - Useful for displaying progress indicators or partial results

5. **Direct Simulation (Sync)**: `/simulate` (POST)
   - Runs a synchronous simulation (blocks until complete)
   - Returns complete results immediately

6. **Get All Results for User**: `/get-simulation-result/{user_id}` (GET)
   - Retrieves all simulation results for a specific user
   - Useful for displaying historical simulation data

## Input Format

The input format for simulation requests is standardized:

```json
{
  "user_id": "unique-user-identifier",
  "user_name": "User's Full Name",
  "income": 50000,
  "expenses": [
    { "name": "Rent", "amount": 15000 },
    { "name": "Groceries", "amount": 5000 },
    { "name": "Utilities", "amount": 3000 },
    { "name": "Transportation", "amount": 2000 }
  ],
  "total_expenses": 25000,
  "goal": "Save for a house down payment",
  "financial_type": "moderate",
  "risk_level": "medium"
}
```

### Important Notes:
- The `user_name` field must contain the user's actual name (not a placeholder)
- The `expenses` array should contain detailed expense categories
- The `financial_type` can be "conservative", "moderate", or "aggressive"
- The `risk_level` can be "low", "medium", or "high"

## Output Format

The output format has been standardized to ensure consistency. Here's the structure of the `simulated_cashflow` section:

```json
{
  "month": 1,
  "user_name": "User's Full Name",
  "income": {
    "salary": 50000,
    "investments": 0,
    "other": 0,
    "total": 50000
  },
  "expenses": {
    "housing": 15000,
    "utilities": 3000,
    "groceries": 5000,
    "transportation": 2000,
    "healthcare": 0,
    "entertainment": 0,
    "dining_out": 0,
    "subscriptions": 0,
    "other": 0,
    "total": 25000
  },
  "savings": {
    "amount": 25000,
    "percentage_of_income": 50,
    "target_met": true
  },
  "balance": {
    "starting": 0,
    "ending": 25000,
    "change": 25000
  },
  "analysis": {
    "spending_categories": {
      "essential": 25000,
      "non_essential": 0,
      "ratio": 1.0
    },
    "savings_rate": "Excellent",
    "cash_flow": "Positive"
  },
  "notes": "Based on your moderate financial type and medium risk level, consider a balanced approach between savings and moderate investments. To achieve your goal of 'Save for a house down payment', continue saving at least 25000 per month."
}
```

## API Functions

The following API functions have been updated or added:

### 1. Start Asynchronous Simulation

```javascript
import { sendFinancialSimulationData } from '../api';

// Example usage
const userData = {
  user_id: "user-123",
  user_name: "John Doe",
  income: 50000,
  expenses: [
    { name: "Rent", amount: 15000 },
    { name: "Groceries", amount: 5000 }
  ],
  total_expenses: 20000,
  goal: "Save for retirement",
  financial_type: "moderate",
  risk_level: "medium"
};

const response = await sendFinancialSimulationData(userData);
if (response.success) {
  const taskId = response.task_id;
  // Store task ID for polling status
}
```

### 2. Check Simulation Status

```javascript
import { checkSimulationStatus } from '../api';

// Example usage
const statusResponse = await checkSimulationStatus(taskId, userId);
if (statusResponse.success) {
  const status = statusResponse.task_status; // "queued", "running", "completed", "failed"
  const progress = statusResponse.progress; // 0-100 percentage
  
  if (status === "completed") {
    // Fetch results
  }
}
```

### 3. Get Simulation Results

```javascript
import { getSimulationResultsByTaskId } from '../api';

// Example usage
const resultsResponse = await getSimulationResultsByTaskId(taskId, userId);
if (resultsResponse.success) {
  const simulationData = resultsResponse.data;
  // Process and display simulation data
  
  // Access cashflow data
  const cashflowData = simulationData.simulated_cashflow;
}
```

### 4. Get Real-time Updates

```javascript
import { getSimulationRealTimeUpdates } from '../api';

// Example usage
const updatesResponse = await getSimulationRealTimeUpdates(taskId, userId);
if (updatesResponse.success) {
  const partialData = updatesResponse.data;
  const progress = updatesResponse.progress;
  // Update UI with partial results and progress
}
```

### 5. Run Direct Simulation

```javascript
import { runDirectSimulation } from '../api';

// Example usage
const directResponse = await runDirectSimulation(userData);
if (directResponse.success) {
  const simulationData = directResponse.data;
  // Process and display simulation data immediately
}
```

### 6. Get All User Results

```javascript
import { getFinancialSimulationResults } from '../api';

// Example usage
const allResultsResponse = await getFinancialSimulationResults(userId);
if (allResultsResponse.success) {
  const allSimulationData = allResultsResponse.data;
  // Display historical simulation data
}
```

## Implementation Notes

1. **Error Handling**: All API functions include comprehensive error handling with specific error messages for different failure scenarios.

2. **Data Processing**: The API functions automatically process and standardize the response data to ensure consistent structure.

3. **Default Values**: Missing fields in the response are populated with sensible default values to prevent UI errors.

4. **Timeouts**: All API requests have appropriate timeouts to prevent hanging UI if the server is unresponsive.

5. **User Identification**: All functions accept a `userId` parameter that defaults to "guest-user" if not provided.

## Example Workflow

A typical workflow for financial simulation would be:

1. Collect user financial data through a form
2. Call `sendFinancialSimulationData` to start the simulation
3. Poll the simulation status using `checkSimulationStatus`
4. Optionally show real-time updates with `getSimulationRealTimeUpdates`
5. When complete, fetch and display results with `getSimulationResultsByTaskId`
6. Store the results for future reference

## Testing

Before deploying to production, please test the integration with these scenarios:
- Basic Simulation: Test with standard inputs
- Edge Cases: Test with very high or low income/expenses
- Error Handling: Test with invalid inputs to ensure proper error handling
- Multi-Month View: Test navigation between different months
- Data Visualization: Test all charts and graphs with the updated data format
