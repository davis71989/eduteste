
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="page-container flex flex-col items-center text-center">
        <span className="text-8xl font-semibold tracking-tighter">404</span>
        <h1 className="mt-6 text-2xl font-medium sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-balance text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button 
          className="mt-8 rounded-full px-6"
          onClick={() => window.location.href = '/'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
