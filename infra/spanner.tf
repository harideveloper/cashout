# Google Cloud Spanner instance and database
resource "google_spanner_instance" "bet_store_instance" {
  name            = "bet-store-instance"
  config          = "regional-europe-west2" 
  display_name    = "bet_store_instance"
  num_nodes       = 1

  labels = {
    app = "cashout"
  }
}

resource "google_spanner_database" "bet_db" {
  instance      = google_spanner_instance.bet_store_instance.name
  name          = "bet-db"
  ddl = [
    "CREATE TABLE Bets (BetID STRING(36) NOT NULL, UserID STRING(36) NOT NULL, EventID STRING(36) NOT NULL, Amount FLOAT64 NOT NULL, Odds FLOAT64 NOT NULL, Status STRING(20) NOT NULL, Timestamp TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true)) PRIMARY KEY(BetID, Timestamp DESC)",
    "CREATE INDEX BetsByUserID ON Bets(UserID)",
    "CREATE INDEX BetsByEventID ON Bets(EventID)"
  ]
  deletion_protection = false
}

output "spanner_database_name" {
  value = google_spanner_database.bet_db.name
}
