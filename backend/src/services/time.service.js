// Function to calculate the difference between two timestamps in minutes
export const calculateTimeDifferenceInMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) {
    console.error("Start time or end time is missing for calculation.");
    return null; // Or throw an error
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Ensure both are valid Date objects
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error("Invalid date format provided for time calculation.");
    return null; // Or throw an error
  }

  const diffMs = end - start; // Difference in milliseconds
  const diffMins = Math.floor(diffMs / 60000); // Convert to minutes and round down

  return diffMins;
};

// Function to format minutes into a human-readable string (e.g., "2 hours 30 minutes")
export const formatMinutes = (minutes) => {
  if (typeof minutes !== 'number' || minutes < 0) {
    console.warn("Invalid input for formatting minutes:", minutes);
    return "0 minutes"; // Or return null/error
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let formattedString = "";

  if (hours > 0) {
    formattedString += `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (mins > 0) {
      formattedString += ` ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
  } else {
    formattedString += `${mins} minute${mins !== 1 ? 's' : ''}`;
  }

  return formattedString || "0 minutes";
};

// Add other time-related utility functions here if needed