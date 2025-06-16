export const dateFormat = (datetime: string) => {
  const dateTime = new Date(datetime);

  return dateTime.toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};