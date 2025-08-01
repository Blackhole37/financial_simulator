// MongoDB initialization script for Financial Simulator
// This script creates the database and collections with proper indexes

// Switch to the financial_simulator database
db = db.getSiblingDB('financial_simulator');

// Create collections
db.createCollection('user_inputs');
db.createCollection('agent_outputs');
db.createCollection('chat_history');
db.createCollection('pdf_metadata');
db.createCollection('pdf_chunks');
db.createCollection('simulation_status');

// Create indexes for better performance

// User inputs collection indexes
db.user_inputs.createIndex({ "user_id": 1 });
db.user_inputs.createIndex({ "created_at": -1 });
db.user_inputs.createIndex({ "simulation_id": 1 });

// Agent outputs collection indexes
db.agent_outputs.createIndex({ "user_id": 1 });
db.agent_outputs.createIndex({ "simulation_id": 1 });
db.agent_outputs.createIndex({ "month": 1 });
db.agent_outputs.createIndex({ "agent_type": 1 });
db.agent_outputs.createIndex({ "created_at": -1 });

// Chat history collection indexes
db.chat_history.createIndex({ "user_id": 1 });
db.chat_history.createIndex({ "session_id": 1 });
db.chat_history.createIndex({ "timestamp": -1 });

// PDF metadata collection indexes
db.pdf_metadata.createIndex({ "user_id": 1 });
db.pdf_metadata.createIndex({ "filename": 1 });
db.pdf_metadata.createIndex({ "upload_date": -1 });

// PDF chunks collection indexes
db.pdf_chunks.createIndex({ "pdf_id": 1 });
db.pdf_chunks.createIndex({ "user_id": 1 });
db.pdf_chunks.createIndex({ "chunk_index": 1 });

// Simulation status collection indexes
db.simulation_status.createIndex({ "simulation_id": 1 }, { unique: true });
db.simulation_status.createIndex({ "user_id": 1 });
db.simulation_status.createIndex({ "status": 1 });
db.simulation_status.createIndex({ "created_at": -1 });

// Create a user for the application
db.createUser({
  user: "financial_app",
  pwd: "financial_app_password",
  roles: [
    {
      role: "readWrite",
      db: "financial_simulator"
    }
  ]
});

print("Financial Simulator database initialized successfully!");
print("Created collections: user_inputs, agent_outputs, chat_history, pdf_metadata, pdf_chunks, simulation_status");
print("Created indexes for optimal performance");
print("Created application user: financial_app");
