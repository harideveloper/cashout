# Google Cloud Pub/Sub topics
resource "google_pubsub_topic" "open_bet" {
  name = "open-bet"

  labels = {
    app = "cashout"
  }

  message_retention_duration = "600s"
}

resource "google_pubsub_topic" "close_bet" {
  name = "close-bet"

  labels = {
    app = "cashout"
  }

  message_retention_duration = "600s"
}

resource "google_pubsub_topic" "odd_change" {
  name = "odd-change"

  labels = {
    app = "cashout"
  }

  message_retention_duration = "600s"
}

resource "google_pubsub_topic" "notify_user" {
  name = "notify-user"

  labels = {
    app = "cashout"
  }

  message_retention_duration = "1200s"
}

# Google Cloud Pub/Sub subscriptions
resource "google_pubsub_subscription" "open_bet_subscription" {
  name  = "open-bet-subscription"
  topic = google_pubsub_topic.open_bet.name

  labels = {
    app = "cashout"
  }

  message_retention_duration = "600s"
  retain_acked_messages      = true

  retry_policy {
    minimum_backoff = "10s"
  }

  enable_message_ordering = false
}

resource "google_pubsub_subscription" "close_bet_subscription" {
  name  = "close-bet-subscription"
  topic = google_pubsub_topic.close_bet.name

  labels = {
    app = "cashout"
  }

  message_retention_duration = "600s"
  retain_acked_messages      = true

  retry_policy {
    minimum_backoff = "10s"
  }

  enable_message_ordering = false
}

resource "google_pubsub_subscription" "odd_change_subscription" {
  name  = "odd-change-subscription"
  topic = google_pubsub_topic.odd_change.name

  labels = {
    app = "cashout"
  }

  message_retention_duration = "600s"
  retain_acked_messages      = true

  retry_policy {
    minimum_backoff = "10s"
  }

  enable_message_ordering = false
}

resource "google_pubsub_subscription" "notify_user_subscription" {
  name  = "notify-user-subscription"
  topic = google_pubsub_topic.notify_user.name

  labels = {
    app = "cashout"
  }

  message_retention_duration = "600s"
  retain_acked_messages      = true

  retry_policy {
    minimum_backoff = "10s"
  }

  enable_message_ordering = false
}
