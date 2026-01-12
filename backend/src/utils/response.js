// Standardized success response format
export const successResponse = (data) => {
  return {
    success: true,
    data: data, // Include the actual response data here
    // Optionally, you could add a default message or status code here if needed
  };
};

// Standardized error response format
export const errorResponse = (message, statusCode = 400) => { // Default status code is 400 Bad Request
  return {
    success: false,
    error: message, // Include the error message here
    // Optionally, you could add the status code here if needed by the frontend
    statusCode // Include status code if needed by the frontend processing logic
  };
};

// Example usage in a controller:
// res.status(200).json(successResponse({ message: 'Operation successful', result: someData }));
// res.status(400).json(errorResponse('Bad request error occurred'));
// res.status(404).json(errorResponse('Resource not found', 404));