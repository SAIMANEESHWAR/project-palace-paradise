import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import Lottie from "lottie-react";
import loaderAnimation from "./infinite-loader.json";
import { useAuth } from "@/context/AuthContext";

interface Project {
  _id: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPercentage: number;
  techStack: string[];
  images: string[];
  videos: string[];
  features: string;
  support: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();


  const [project, setProject] = useState<Project | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`https://project-palace-paradise.onrender.com/api/projects/${id}`);
        const data = await response.json();
        setProject(data);
        if (data.discountPercentage) setDiscount(data.discountPercentage);
      } catch (error) {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id, navigate]);

  const getImage = (index: number) => {
    if (!project || !project.images.length) return "/placeholder.svg";
    return project.images[index] || "/placeholder.svg";
  };

  const extractDriveFileId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    return match ? match[1] : null;
  };
  

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const handlePrevImage = () => {
    setActiveImage((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImage((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  };

  const handleApplyPromoCode = () => {
    if (promoCode === "444555") {
      toast({
        title: "Student Discount Applied!",
        description: "10% discount has been applied.",
      });
      setDiscount(10);
    } else {
      toast({
        title: "Invalid Promo Code",
        description: "This promo code is not valid.",
        variant: "destructive",
      });
    }
  };

  const calculatePrice = () => {
    if (!project) return "0.00";
    const price = discount ? project.price - (project.price * discount) / 100 : project.price;
    return price.toFixed(2);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate("/loginuser");
      return;
    }
  
    if (!project) return;

    setIsPaying(true);
    const finalAmount = parseFloat(calculatePrice());

    try {
      const response = await fetch("https://project-palace-paradise.onrender.com/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });

      const data = await response.json();

      if (!data.id) throw new Error("Order creation failed");

      const options = {
        key: "rzp_live_WBNb9cCApSSirD",
        amount: data.amount,
        currency: "INR",
        name: "Project Palace",
        description: project.title,
        order_id: data.id,
        handler: async function (response: any) {
          toast({
            title: "Payment Successful 🎉",
            description: `Payment ID: ${response.razorpay_payment_id}`,
          });
        
          const storedUser = localStorage.getItem("user");
          const user = storedUser ? JSON.parse(storedUser) : null;
        
          try {
            const res = await fetch("https://project-palace-paradise.onrender.com/api/purchases/store", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username: user?.username || "Customer",
                email: user?.email || "customer@example.com",
                projectId: project._id,
                paymentId: response.razorpay_payment_id,
              }),
            });
        
            if (res.ok) {
              toast({
                title: "Project Added to Cart 🛒",
                description: "You can now view it in your purchased projects section.",
              });
            } else {
              toast({
                title: "Storage Failed",
                description: "Purchase recorded, but failed to update cart.",
                variant: "destructive",
              });
            }
          } catch (err) {
            console.error("Failed to store purchase", err);
          }
        
          setTimeout(() => navigate("/"), 2000);
        }
        
        
        
        ,
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast({
        title: "Payment Error",
        description: "Something went wrong. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Lottie animationData={loaderAnimation} loop className="w-40 h-40" />
      </div>
    );
  }

  if (!project) {
    return <div className="flex items-center justify-center min-h-screen">Project not found.</div>;
  }

  const imageCount = project.images.length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* IMAGE PREVIEW */}
          <div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary/30">
              <img src={getImage(activeImage)} alt={`Preview ${activeImage + 1}`} className="w-full h-full object-cover" />
              <Button variant="outline" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-10" onClick={handlePrevImage}>
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button variant="outline" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-10" onClick={handleNextImage}>
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>

            <div className="flex gap-2 mt-4 overflow-x-auto py-2">
              {[...Array(imageCount)].map((_, index) => (
                <div key={index} onClick={() => setActiveImage(index)} className={`cursor-pointer w-20 h-14 sm:w-24 sm:h-16 border-2 rounded overflow-hidden flex-shrink-0 ${activeImage === index ? "border-primary" : "border-transparent"}`}>
                  <img src={getImage(index)} className="w-full h-full object-cover" alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* PROJECT DETAILS */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{project.title}</h1>
            <div className="flex flex-wrap gap-2 my-4">
              {project.techStack.map((tech) => (
                <span key={tech} className="bg-secondary px-3 py-1 rounded-full text-sm">{tech}</span>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="text-muted-foreground mb-4 text-sm sm:text-base">{project.shortDescription}</div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold">₹{calculatePrice()}</span>
              {discount && (
                <>
                  <span className="text-base line-through text-muted-foreground">₹{project.price.toFixed(2)}</span>
                  <span className="bg-accent px-3 py-1 rounded-full text-sm">{discount}% OFF</span>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="px-3 py-2 border rounded-md text-sm w-full sm:w-40"
              />
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleApplyPromoCode}>
                Apply
              </Button>
            </div>
            <div className="text-sm mt-2 text-green-600">
              STUDENT OFFER: 10% DISCOUNT with code 444555
            </div>

            <Button size="lg" className="mt-6 w-full" onClick={handleBuyNow} disabled={isPaying}>
              {isPaying ? "Processing..." : <><ShoppingCart className="mr-2 h-5 w-5" /> Buy Now</>}
            </Button>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="description" className="mt-12">
          <TabsList className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card className="mt-4">
              <CardHeader><CardTitle>Project Description</CardTitle></CardHeader>
              <CardContent>
                {project.description.replace(/\n+/g, "\n").split("\n").map((line, idx) => (
                  <p key={idx} className="mb-2">{line}</p>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card className="mt-4">
              <CardHeader><CardTitle>Key Features</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {project.features.replace(/\n+/g, "\n").split("\n").map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card className="mt-4">
              <CardHeader><CardTitle>Support Information</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {project.support.replace(/\n+/g, "\n").split("\n").map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* VIDEO */}
        {project.videos && project.videos.length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader><CardTitle>Demo Video</CardTitle></CardHeader>
              <CardContent>
                <div className="aspect-video rounded overflow-hidden">
                  <iframe
                    src={getYouTubeEmbedUrl(project.videos[0]) || ""}
                    title="YouTube Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
