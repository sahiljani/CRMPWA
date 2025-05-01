// Use relative path for the Next.js API proxy route
// This ensures requests go to our backend first, which then forwards to the CRM API.
// const API_BASE_URL = '/api/crm'; // Using proxy

// Reverted to direct API URL based on user feedback and CORS issues with proxy setup
const API_BASE_URL = 'https://crm.borderiq.org/api';


/**
 * Represents a lead in the BorderIQ CRM.
 */
export interface Lead {
  /**
   * The unique identifier of the lead.
   */
  id: string;
  /**
   * The hash of the lead.
   */
  hash?: string;
  /**
   * The name of the lead.
   */
  name: string;
  /**
   * The contact information of the lead.
   */
  contact?: string;
  /**
   * The title of the lead.
   */
  title?: string;
  /**
   * The company associated with the lead.
   */
  company?: string;
  /**
   * The description of the lead.
   */
  description?: string;
  /**
   * The country of the lead.
   */
  country?: string; // Assuming country ID is returned as string
  /**
   * The zip code of the lead.
   */
  zip?: string | null;
  /**
   * The city of the lead.
   */
  city?: string;
  /**
   * The state of the lead.
   */
  state?: string;
  /**
   * The address of the lead.
   */
  address?: string;
  /**
   * The user assigned to the lead.
   */
  assigned: string; // Assuming assigned user ID is returned as string
  /**
   * The date the lead was added. Format: "YYYY-MM-DD HH:MM:SS"
   */
  dateadded?: string;
  /**
   * The form ID the lead originated from.
   */
  from_form_id?: string;
  /**
   * The status of the lead.
   */
  status: string; // Assuming status ID is returned as string
  /**
   * The source of the lead.
   */
  source: string; // Assuming source ID is returned as string
  // Allow for other potential fields returned by the API
  email?: string;
  website?: string;
  phonenumber?: string;
  default_language?: string;
  lastcontact?: string;
  is_public?: string;
  tags?: string; // Assuming tags might be returned as a string
  [key: string]: any;
}


/**
 * Represents the data required to create a new lead.
 * Simplified to only include essential fields for the current UI.
 */
export interface CreateLeadData {
  name: string; // Mandatory
  phonenumber?: string; // Optional
  // Default values will be set when calling the API
  source?: string; // Made optional, will default
  status?: string; // Made optional, will default
  assigned?: string; // Made optional, will default
}

/**
 * Represents the data required to update a lead.
 * Simplified for current UI needs.
 */
export interface UpdateLeadData {
  name: string; // Mandatory per docs, always included
  phonenumber?: string; // Optional field to update
  // Required by API for update, will be fetched and included
  source: string;
  status: string;
  assigned: string;
}

// --- Helper Data (Keep as is) ---

export const leadStatuses = [
    { id: '1', name: 'New' }, // First possible status
    { id: '2', name: 'Contacted' },
    { id: '3', name: 'Qualified' },
    { id: '4', name: 'Proposal Sent' },
    { id: '5', name: 'Negotiation' },
    { id: '6', name: 'Won' },
    { id: '7', name: 'Lost' },
];

// Default values based on assumed first possible option IDs from CRM setup
export const defaultSourceId = '5'; // Assume '5' corresponds to 'Other' or a default source
export const defaultStatusId = '1'; // Assume '1' corresponds to 'New' (first in our list)
export const defaultAssigneeId = '1'; // Assume '1' corresponds to a default user (e.g., 'Admin User')


// Helper function for making direct API requests
async function fetchCrmApi<T>(
  endpoint: string,
  authToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`; // e.g., https://crm.borderiq.org/api/leads

  const headers = {
    'authtoken': authToken,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Log the request details for debugging
  console.log(`Making API request to: ${options.method || 'GET'} ${url}`);
  // Avoid logging the full token in production environments if possible
  // console.log(`With Auth Token: ${authToken ? authToken.substring(0, 10) + '...' : 'None'}`);
  if (options.body) {
      // Be cautious about logging sensitive body data
      // console.log(`With Body: ${options.body}`);
  }


  const response = await fetch(url, { ...options, headers });

   // Log response status
  console.log(`API Response Status: ${response.status}`);


  // More detailed error handling
  if (!response.ok) {
    let errorData: any = { message: `API request failed with status ${response.status}` };
    try {
      const responseText = await response.text();
      console.error("API Error Response Text:", responseText); // Log raw error response
      errorData = JSON.parse(responseText); // Try parsing as JSON
    } catch (e) {
      // Parsing failed or not JSON, stick with status message
      console.error("Failed to parse error response as JSON or non-JSON error:", e);
    }
    // Throw error with message from API if available
    throw new Error(errorData?.message || `API request failed with status ${response.status}`);
  }

  // Handle potential non-JSON success responses or empty body
    const responseText = await response.text();
    if (!responseText) {
        console.log("API returned successful status code but empty body.");
        // Return an empty object or appropriate type based on expected response
        // For DELETE/PUT that return success status only, this might be expected
        if (options.method === 'DELETE' || options.method === 'PUT') {
             return { status: true, message: 'Operation successful (No content)' } as T;
        }
        return {} as T;
    }

   try {
     const data: any = JSON.parse(responseText); // Try parsing as JSON
     console.log("API Success Response Data:", data);

     // Check for explicit failure status within the JSON response body
     // The CRM API seems to use `status: false` for logical failures
     if (data.status === false) {
        console.error("API operation indicated failure:", data.message);
        throw new Error(data.message || 'API operation failed.');
     }
     return data as T;
   } catch (e) {
     // If parsing failed but status was OK, could be unexpected response format
     console.error("Failed to parse successful response as JSON:", e);
     console.error("Raw success response text:", responseText);
     // If status was ok, but response wasn't JSON as expected
     throw new Error("Received unexpected response format from API.");
   }
}

/**
 * Asynchronously adds a new lead to the BorderIQ CRM.
 * Ensures default values for source, status, and assigned are included.
 *
 * @param authToken The authentication token.
 * @param leadData The data for the new lead (only name and phonenumber needed from UI).
 * @returns A promise that resolves to the API response.
 */
export async function addLead(authToken: string, leadData: CreateLeadData): Promise<{ status: boolean; message: string; id?: string }> {
    console.log("Adding lead with data:", leadData);

    // Create the full payload, ensuring compulsory fields have defaults
    const fullLeadData: any = {
        name: leadData.name,
        phonenumber: leadData.phonenumber || undefined, // Send undefined if empty
        source: leadData.source || defaultSourceId, // Use default if not provided
        status: leadData.status || defaultStatusId, // Use default if not provided
        assigned: leadData.assigned || defaultAssigneeId, // Use default if not provided
    };

    console.log("Sending lead data to API:", fullLeadData);

    // Endpoint confirmed from working curl
    return fetchCrmApi<{ status: boolean; message: string; id?: string }>(`/leads`, authToken, {
        method: 'POST',
        body: JSON.stringify(fullLeadData),
    });
}


/**
 * Asynchronously retrieves lead information.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to retrieve.
 * @returns A promise that resolves to a Lead object.
 */
export async function getLead(authToken: string, id: string): Promise<Lead> {
    console.log("Retrieving lead with ID:", id);
    return fetchCrmApi<Lead>(`/leads/${id}`, authToken, { method: 'GET' });
}


/**
 * Asynchronously retrieves all leads.
 * Endpoint confirmed from working curl command: `/leadsi/leads`.
 *
 * @param authToken The authentication token.
 * @returns A promise that resolves to an array of Lead objects.
 */
export async function getAllLeads(authToken: string): Promise<Lead[]> {
    console.log("Retrieving all leads.");
    // Corrected endpoint based on working curl command
    return fetchCrmApi<Lead[]>(`/leadsi/leads`, authToken, { method: 'GET' });
}


/**
 * Asynchronously searches for leads.
 *
 * @param authToken The authentication token.
 * @param keysearch The search keywords.
 * @returns A promise that resolves to an array of Lead objects.
 */
export async function searchLeads(authToken: string, keysearch: string): Promise<Lead[]> {
    console.log("Searching leads with keyword:", keysearch);
    const encodedKeysearch = encodeURIComponent(keysearch);
    // Assuming the search endpoint follows the pattern, adjust if needed
    // Check CRM API docs for the exact search endpoint if `/leads/search/` doesn't work
    return fetchCrmApi<Lead[]>(`/leads/search/${encodedKeysearch}`, authToken, { method: 'GET' });
}


/**
 * Asynchronously updates a lead.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to update.
 * @param leadData The data to update for the lead (must include name, source, status, assigned).
 * @returns A promise that resolves to the success/failure message from the API.
 */
export async function updateLead(authToken: string, id: string, leadData: UpdateLeadData): Promise<{ status: boolean; message: string }> {
    console.log("Updating lead with ID:", id, "and data:", leadData);

    // Ensure all mandatory fields for update are included in the payload sent
    const fullUpdateData: UpdateLeadData = {
        name: leadData.name,
        phonenumber: leadData.phonenumber,
        source: leadData.source, // Should come from existing lead data
        status: leadData.status, // The new status selected by user
        assigned: leadData.assigned, // Should come from existing lead data
    };

    return fetchCrmApi<{ status: boolean; message: string }>(`/leads/${id}`, authToken, {
        method: 'PUT',
        body: JSON.stringify(fullUpdateData),
    });
}

/**
 * Asynchronously deletes a lead.
 * Endpoint confirmed from API structure: `/delete/leads/{id}`.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to delete.
 * @returns A promise that resolves to the success/failure message from the API.
 */
export async function deleteLead(authToken: string, id: string): Promise<{ status: boolean; message: string }> {
    console.log("Deleting lead with ID:", id);
    return fetchCrmApi<{ status: boolean; message: string }>(`/delete/leads/${id}`, authToken, {
        method: 'DELETE',
    });
}
