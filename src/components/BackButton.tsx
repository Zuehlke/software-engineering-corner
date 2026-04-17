export const BackButton = () => {
  const hasVisitedHome = sessionStorage.getItem('dev-ex.hasVisitedHome');

  if (hasVisitedHome === 'true') {
    return <button onClick={() => history.back()} className="cursor-pointer">{'<'} Back</button>;
  }
  return <a href="/">{'<'} Back</a>;
};