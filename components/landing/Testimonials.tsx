import { testimonials } from "@/constants";
import { MessageCircleHeartIcon } from "lucide-react";
import Rating from "@/components/shared/Rating";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export default function Testimonials() {
  return (
    <section className="pb-16 md:pb-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 mb-6">
            <MessageCircleHeartIcon className="size-8 text-primary" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Customers Say
          </h2>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover why our customers love our tech products and exceptional
            service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="h-full flex flex-col transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary/20"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  {testimonial.avatar && (
                    <div className="mr-4 shrink-0">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={64}
                        height={64}
                        className="rounded-full size-16 object-cover ring-2 ring-primary/10"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {testimonial.name}
                    </h3>
                    <div className="flex text-yellow-400 gap-0.5">
                      <Rating rating={testimonial.rating} size={18} />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground italic leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </CardContent>
              <CardFooter className="pt-0 text-sm text-muted-foreground/70">
                {new Date(testimonial.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
