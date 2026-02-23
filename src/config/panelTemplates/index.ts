export interface PanelTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  operatingSystem: string;
  config: {
    title: string;
    queries: any[];
  };
}

export const panelTemplates: PanelTemplate[] = [
  {
    id: 'cpu-saturation-usage',
    name: 'CPU Saturation & Usage',
    description: 'Tracks CPU utilization and saturation (load average normalized by core count)',
    category: 'System Metrics',
    icon: 'cpu',
    operatingSystem: 'Linux',
    config: {
      title: 'CPU Saturation & Usage',
      queries: [
        {
          id: 'cpu-utilization',
          query: '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)',
          units: '%',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'CPU Utilization',
            }
          ],
        },
        {
          id: 'cpu-saturation-load',
          query: 'node_load1 / count without (cpu, mode) (node_cpu_seconds_total{mode="idle"})',
          units: 'load',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'CPU Load per Core',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'memory-utilization',
    name: 'Memory Utilization',
    description: 'Tracks actual used memory using MemAvailable (accounts for cache as available)',
    category: 'System Metrics',
    icon: 'memory',
    operatingSystem: 'Linux',
    config: {
      title: 'Memory Utilization',
      queries: [
        {
          id: 'memory-utilization',
          query: '100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))',
          units: '%',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'Memory Utilization',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'disk-io-latency',
    name: 'Disk I/O Latency',
    description: 'Tracks average time (in seconds) that I/O requests spend waiting to be serviced',
    category: 'System Metrics',
    icon: 'storage',
    operatingSystem: 'Linux',
    config: {
      title: 'Disk I/O Latency',
      queries: [
        {
          id: 'disk-read-latency',
          query: 'rate(node_disk_read_time_seconds_total[1m]) / rate(node_disk_reads_completed_total[1m])',
          units: 's',
          resolution: 4,
          series: [
            {
              series_name: '',
              series_rename: 'Disk Read Latency',
            }
          ],
        },
        {
          id: 'disk-write-latency',
          query: 'rate(node_disk_write_time_seconds_total[1m]) / rate(node_disk_writes_completed_total[1m])',
          units: 's',
          resolution: 4,
          series: [
            {
              series_name: '',
              series_rename: 'Disk Write Latency',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'network-traffic-drops',
    name: 'Network Traffic & Drops',
    description: 'Monitors throughput and packet drops (saturation)',
    category: 'Network',
    icon: 'network',
    operatingSystem: 'Linux',
    config: {
      title: 'Network Traffic & Drops',
      queries: [
        {
          id: 'network-receive-traffic',
          query: 'rate(node_network_receive_bytes_total[1m]) * 8',
          units: 'bits/s',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'Network Receive',
            }
          ],
        },
        {
          id: 'network-transmit-traffic',
          query: 'rate(node_network_transmit_bytes_total[1m]) * 8',
          units: 'bits/s',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'Network Transmit',
            }
          ],
        },
        {
          id: 'network-drops',
          query: 'rate(node_network_receive_drop_total[1m]) + rate(node_network_transmit_drop_total[1m])',
          units: 'packets/s',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'Network Drops',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'windows-cpu-usage-dpc',
    name: 'CPU Usage & DPC Spikes',
    description: 'Monitors overall CPU usage and DPC Time (driver/hardware interrupts)',
    category: 'System Metrics',
    icon: 'cpu',
    operatingSystem: 'Windows',
    config: {
      title: 'CPU Usage & DPC Spikes',
      queries: [
        {
          id: 'windows-cpu-total-usage',
          query: '100 - (avg by (instance) (rate(windows_cpu_time_total{mode="idle"}[1m])) * 100)',
          units: '%',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'CPU Usage',
            }
          ],
        },
        {
          id: 'windows-cpu-dpc-interrupts',
          query: '100 * sum by (instance) (rate(windows_cpu_time_total{mode=~"dpc|interrupt"}[1m])) / count without(mode)(windows_cpu_time_total{mode="idle"})',
          units: '%',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'DPC/Interrupts',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'windows-memory-usage',
    name: 'Memory Usage',
    description: 'Tracks committed memory bytes vs. total physical memory',
    category: 'System Metrics',
    icon: 'memory',
    operatingSystem: 'Windows',
    config: {
      title: 'Memory Usage',
      queries: [
        {
          id: 'windows-memory-utilization',
          query: '100 * (1 - (windows_memory_available_bytes / windows_memory_physical_total_bytes))',
          units: '%',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'Memory Usage',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'windows-disk-queue-length',
    name: 'Disk Queue Length',
    description: 'Disk saturation indicator - if consistently > 1, processes are blocking',
    category: 'System Metrics',
    icon: 'storage',
    operatingSystem: 'Windows',
    config: {
      title: 'Disk Queue Length',
      queries: [
        {
          id: 'windows-disk-queue',
          query: 'windows_logical_disk_requests_queued',
          units: 'requests',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'Disk Queue Length',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'windows-system-uptime',
    name: 'System Up/Down Status',
    description: 'Tracks system availability and uptime',
    category: 'System Metrics',
    icon: 'cpu',
    operatingSystem: 'Windows',
    config: {
      title: 'System Up/Down Status',
      queries: [
        {
          id: 'windows-uptime',
          query: 'count(windows_os_info) or vector(0)',
          units: '',
          resolution: 0,
          series: [
            {
              series_name: '',
              series_rename: 'System Status',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'windows-network-bandwidth',
    name: 'Network Bandwidth',
    description: 'Total bytes received and sent across all interfaces',
    category: 'Network',
    icon: 'network',
    operatingSystem: 'Windows',
    config: {
      title: 'Network Bandwidth',
      queries: [
        {
          id: 'windows-network-total',
          query: 'sum by (instance) (rate(windows_net_bytes_total[1m]))',
          units: 'bytes/s',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'Network Bandwidth',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'prometheus-query-rate',
    name: 'Prometheus Query Rate',
    description: 'Rate of Prometheus queries per second',
    category: 'Prometheus Metrics',
    icon: 'cpu',
    operatingSystem: 'observability-node',
    config: {
      title: 'Prometheus Query Rate',
      queries: [
        {
          id: 'prometheus-query-rate',
          query: 'rate(prometheus_http_requests_total[5m])',
          units: 'req/s',
          resolution: 2,
          series: [
            {
              series_name: '',
              series_rename: 'Query Rate',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'prometheus-scrape-duration',
    name: 'Scrape Duration',
    description: 'Time taken to scrape targets',
    category: 'Prometheus Metrics',
    icon: 'storage',
    operatingSystem: 'observability-node',
    config: {
      title: 'Scrape Duration',
      queries: [
        {
          id: 'prometheus-scrape-duration',
          query: 'prometheus_target_interval_length_seconds',
          units: 's',
          resolution: 4,
          series: [
            {
              series_name: '',
              series_rename: 'Scrape Duration',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'prometheus-targets-up',
    name: 'Targets Up/Down',
    description: 'Number of targets that are up',
    category: 'Prometheus Metrics',
    icon: 'network',
    operatingSystem: 'observability-node',
    config: {
      title: 'Targets Up/Down',
      queries: [
        {
          id: 'prometheus-targets-up',
          query: 'up',
          units: '',
          resolution: 0,
          series: [
            {
              series_name: '',
              series_rename: 'Target Status',
            }
          ],
        },
      ],
    },
  },
  {
    id: 'custom-panel-linux',
    name: 'Custom Panel',
    description: 'Start with a blank panel and add your own queries',
    category: 'Custom',
    icon: 'add',
    operatingSystem: 'Linux',
    config: {
      title: 'New Panel',
      queries: [],
    },
  },
  {
    id: 'custom-panel-windows',
    name: 'Custom Panel',
    description: 'Start with a blank panel and add your own queries',
    category: 'Custom',
    icon: 'add',
    operatingSystem: 'Windows',
    config: {
      title: 'New Panel',
      queries: [],
    },
  },
  {
    id: 'custom-panel-prometheus',
    name: 'Custom Panel',
    description: 'Start with a blank panel and add your own queries',
    category: 'Custom',
    icon: 'add',
    operatingSystem: 'observability-node',
    config: {
      title: 'New Panel',
      queries: [],
    },
  },
];

export const getPanelTemplateById = (id: string): PanelTemplate | undefined => {
  return panelTemplates.find(template => template.id === id);
};

export const getPanelTemplatesByCategory = (category: string): PanelTemplate[] => {
  return panelTemplates.filter(template => template.category === category);
};

export const getPanelTemplatesByOS = (operatingSystem: string): PanelTemplate[] => {
  return panelTemplates.filter(template => template.operatingSystem === operatingSystem);
};

export const getAllCategories = (): string[] => {
  return Array.from(new Set(panelTemplates.map(template => template.category)));
};
