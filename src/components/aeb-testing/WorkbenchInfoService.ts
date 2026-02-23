export interface WorkbenchInfo {
  organizationId: string;
  tenantId: string;
  region: string;
  odWorkbenchId: string;
  carmakerWorkbenchId: string;
  odStatus?: string;
  carmakerStatus?: string;
}

interface ProvisionedProduct {
  projectId: string;
  userId: string;
  status: string;
  productName: string;
  provisionedProductType: string;
  region: string;
  instanceId: string;
  provisioningParameters: Array<{
    key: string;
    value: string;
  }>;
}

interface WorkbenchApiResponse {
  pagingKey: string | null;
  provisionedProducts: ProvisionedProduct[];
}

export class WorkbenchInfoService {
  private apiUrl: string;
  private defaultWorkbenchInfo: WorkbenchInfo;
  private authToken?: string;

  constructor(apiUrl: string = "", token?: string) {
    this.apiUrl = apiUrl;
    this.authToken = token;
    
    // Default fallback values from CarmakerEventStream.ts
    this.defaultWorkbenchInfo = {
      organizationId: "",
      tenantId: "",
      region: "",
      odWorkbenchId: "",
      carmakerWorkbenchId: "",
      odStatus: "UNKNOWN",
      carmakerStatus: "UNKNOWN"
    };
  }

  /**
   * Set or update the authorization token
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Fetch workbench information from the REST API
   */
  public async fetchWorkbenchInfo(token?: string): Promise<WorkbenchInfo> {
    try {
      console.log(`Fetching workbench info from: ${this.apiUrl}`);
      
      // Use provided token, instance token, or no token
      const authToken = token || this.authToken;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      };

      // Add Authorization header if token is available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      const data: WorkbenchApiResponse = await response.json();
      console.log('API Response received:', data);

      return this.parseWorkbenchData(data);

    } catch (error) {
      console.error('Error fetching workbench info:', error);
      
      // Return default values on error
      return this.defaultWorkbenchInfo;
    }
  }

  /**
   * Fetch workbench information from the REST API with custom headers
   */
  public async fetchWorkbenchInfoWithHeaders(headers: Record<string, string>): Promise<WorkbenchInfo> {
    try {
      console.log(`Fetching workbench info from: ${this.apiUrl}`);
      
      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      const data: WorkbenchApiResponse = await response.json();
      console.log('API Response received:', data);

      return this.parseWorkbenchData(data);

    } catch (error) {
      console.error('Error fetching workbench info:', error);
      
      // Return default values on error
      return this.defaultWorkbenchInfo;
    }
  }

  /**
   * Parse the API response to extract only essential workbench information
   */
  private parseWorkbenchData(data: WorkbenchApiResponse): WorkbenchInfo {
    try {
      const provisionedProducts = data.provisionedProducts || [];
      
      if (provisionedProducts.length === 0) {
        console.warn('No provisioned products found in API response');
        return this.defaultWorkbenchInfo;
      }

      // Find CarMaker and OD workbenches based on product names
      const carmakerWorkbench = provisionedProducts.find(product => 
        product.productName.toLowerCase().includes('carmaker')
      );

      const odWorkbench = provisionedProducts.find(product => 
        product.provisionedProductType === 'VIRTUAL_TARGET' ||
        product.productName.toLowerCase().includes('vecu')
      );

      // Extract common information from the first available product
      const firstProduct = provisionedProducts[0];
      
      const workbenchInfo: WorkbenchInfo = {
        organizationId: firstProduct.projectId || this.defaultWorkbenchInfo.organizationId,
        tenantId: this.extractTenantId(firstProduct) || this.defaultWorkbenchInfo.tenantId,
        region: firstProduct.region || this.defaultWorkbenchInfo.region,
        odWorkbenchId: odWorkbench?.instanceId || this.defaultWorkbenchInfo.odWorkbenchId,
        carmakerWorkbenchId: carmakerWorkbench?.instanceId || this.defaultWorkbenchInfo.carmakerWorkbenchId,
        odStatus: odWorkbench?.status || this.defaultWorkbenchInfo.odStatus,
        carmakerStatus: carmakerWorkbench?.status || this.defaultWorkbenchInfo.carmakerStatus
      };

      console.log('Parsed workbench info:', workbenchInfo);

      return workbenchInfo;

    } catch (error) {
      console.error('Error parsing workbench data:', error);
      return this.defaultWorkbenchInfo;
    }
  }

  /**
   * Extract tenant ID from provisioned product data
   */
  private extractTenantId(product: ProvisionedProduct): string | null {
    // Try to extract from userId field
    if (product.userId) {
      return product.userId;
    }

    // Try to extract from provisioning parameters
    const ownerTidParam = product.provisioningParameters?.find(param => 
      param.key === 'OwnerTID'
    );
    
    if (ownerTidParam) {
      return ownerTidParam.value;
    }

    return null;
  }

  /**
   * Get formatted workbench information for display
   */
  public formatWorkbenchInfo(workbenchInfo: WorkbenchInfo): string {
    let output = '=== Workbench Information ===\n';
    output += `Organization ID: ${workbenchInfo.organizationId}\n`;
    output += `Tenant ID: ${workbenchInfo.tenantId}\n`;
    output += `Region: ${workbenchInfo.region}\n`;
    output += `OD Workbench ID: ${workbenchInfo.odWorkbenchId} (Status: ${workbenchInfo.odStatus})\n`;
    output += `CarMaker Workbench ID: ${workbenchInfo.carmakerWorkbenchId} (Status: ${workbenchInfo.carmakerStatus})\n`;
    
    return output;
  }

  /**
   * Get only the basic workbench info
   */
  public async getWorkbenchInfo(token?: string): Promise<WorkbenchInfo> {
    return await this.fetchWorkbenchInfo(token);
  }

  /**
   * Check if workbenches are running
   */
  public isWorkbenchRunning(workbenchInfo: WorkbenchInfo): {
    carmakerRunning: boolean;
    odRunning: boolean;
    bothRunning: boolean;
  } {
    const carmakerRunning = workbenchInfo.carmakerStatus === 'RUNNING';
    const odRunning = workbenchInfo.odStatus === 'RUNNING';
    const bothRunning = carmakerRunning && odRunning;

    return {
      carmakerRunning,
      odRunning,
      bothRunning
    };
  }

  /**
   * Display workbench information to console
   */
  public async displayWorkbenchInfo(): Promise<void> {
    const workbenchInfo = await this.fetchWorkbenchInfo();
    const formatted = this.formatWorkbenchInfo(workbenchInfo);
    console.log(formatted);
  }

  /**
   * Test the API connection
   */
  public async testConnection(token?: string): Promise<boolean> {
    try {
      console.log(`Testing connection to: ${this.apiUrl}`);
      
      // Use provided token, instance token, or no token
      const authToken = token || this.authToken;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      };

      // Add Authorization header if token is available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000), // 10 second timeout for test
      });

      const isConnected = response.ok;
      console.log(`Connection test result: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      
      if (!isConnected) {
        console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      return isConnected;

    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export default instance for easy use
export const workbenchInfoService = new WorkbenchInfoService();

// Export utility function for direct usage
export async function getWorkbenchInfo(): Promise<WorkbenchInfo> {
  return await workbenchInfoService.getWorkbenchInfo();
}

// Export utility function to display info
export async function displayWorkbenchInfo(): Promise<void> {
  await workbenchInfoService.displayWorkbenchInfo();
}
