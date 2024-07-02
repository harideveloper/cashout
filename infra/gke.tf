## gke module
module "gke" {
  source = "terraform-google-modules/kubernetes-engine/google"
  count  = var.gke_enabled ? 1 : 0

  project_id                = module.vpc.project_id
  name                      = var.application
  regional                  = false
  region                    = var.region
  zones                     = [var.gke_zone]
  network                   = module.vpc.network_name
  subnetwork                = local.subnet_name
  ip_range_pods             = "${var.subnet_name}-pod-cidr"
  ip_range_services         = "${var.subnet_name}-svc1-cidr"
  default_max_pods_per_node = 64
  network_policy            = true
  release_channel           = var.gke_channel

  node_pools = [
    {
      name         = "np-${var.application}"
      autoscaling  = false
      auto_upgrade = true
      min_count    = local.node_count
      max_count    = local.node_count
      node_count   = local.node_count
      machine_type = local.machine_type
      #disk_size   = "50"
    },
  ]
  depends_on = [module.vpc]
}


## Module Gke Auth
module "gke_auth" {
  source = "terraform-google-modules/kubernetes-engine/google//modules/auth"
  count  = var.gke_enabled ? 1 : 0

  project_id   = var.project
  cluster_name = module.gke[0].name
  location     = module.gke[0].location
  depends_on   = [module.gke]
}

resource "local_file" "gke_kubeconfig" {
  count = var.gke_enabled ? 1 : 0

  content  = module.gke_auth[0].kubeconfig_raw
  filename = "${var.application}-kubeconfig.secret"
}



## gke container data
data "google_container_cluster" "gke" {
  count  = var.gke_enabled ? 1 : 0
  name     = var.application
  location = var.gke_zone

  depends_on = [module.gke]
}

