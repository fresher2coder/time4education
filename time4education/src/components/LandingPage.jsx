import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Code, Users, Video } from "lucide-react";
import React from "react";

const features = [
  {
    icon: Video,
    title: "Live Classes",
    description:
      "Interactive live sessions with real-time doubt resolution and peer collaboration.",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Users,
    title: "Expert Mentors",
    description:
      "Learn from industry professionals with years of real-world experience.",
    bgColor: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    icon: Briefcase,
    title: "Placement Support",
    description:
      "Dedicated career guidance and job placement assistance for all graduates.",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Code,
    title: "Real Projects",
    description:
      "Build your portfolio with hands-on projects based on industry requirements.",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Full Stack Developer",
    avatar: "/image.png",
    testimonial:
      "Time4Education completely transformed my career. The live sessions and mentorship helped me land my dream job in just 6 months!",
    rating: "/img.png",
  },
  {
    name: "Mike Chen",
    role: "Data Scientist",
    avatar: "/img-2.png",
    testimonial:
      "The practical approach and real-world projects gave me the confidence to switch careers. Best investment I've ever made!",
    rating: "/div-2.svg",
  },
  {
    name: "Emily Rodriguez",
    role: "UX Designer",
    avatar: "/img-3.png",
    testimonial:
      "Amazing community and support system. The mentors are always available to help, and the course content is top-notch!",
    rating: "/div-3.svg",
  },
];

const LandingPage = () => {
  return (
    <div className="w-full relative">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-24">
        <div className="max-w-7xl mx-auto px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h1 className="text-6xl font-bold leading-[60px] [font-family:'Inter-Bold',Helvetica]">
                <span className="text-slate-900">Learn</span>
                <span className="text-sky-500"> Smarter</span>
                <span className="text-slate-900">, Achieve</span>
                <span className="text-cyan-500"> Faster</span>
              </h1>

              <p className="text-lg text-gray-600 leading-[30px] [font-family:'Inter-Regular',Helvetica] max-w-[565px]">
                Join thousands of students advancing their careers with our
                expert-led courses, hands-on projects, and personalized learning
                paths.
              </p>

              <div className="flex gap-4">
                <Button className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 h-[60px] rounded-xl shadow-lg [font-family:'Inter-SemiBold',Helvetica] font-semibold">
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-sky-500 text-sky-500 hover:bg-sky-50 px-8 py-4 h-[60px] rounded-xl [font-family:'Inter-SemiBold',Helvetica] font-semibold"
                >
                  Explore Courses
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-[512px] h-[512px] rounded-2xl shadow-2xl bg-cover bg-center bg-[url(/landingPage.jpeg)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 [font-family:'Inter-Bold',Helvetica]">
              Why Choose Time4Education?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto [font-family:'Inter-Regular',Helvetica]">
              Experience learning like never before with our comprehensive
              platform designed for your success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border border-gray-100 shadow-lg rounded-2xl"
              >
                <CardContent className="p-8">
                  <div
                    className={`w-16 h-16 ${feature.bgColor} rounded-xl flex items-center justify-center mb-8`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900 mb-4 [font-family:'Inter-SemiBold',Helvetica]">
                    {feature.title}
                  </h3>

                  <p className="text-base text-gray-600 leading-normal [font-family:'Inter-Regular',Helvetica]">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 [font-family:'Inter-Bold',Helvetica]">
              What Our Students Say
            </h2>
            <p className="text-lg text-gray-600 [font-family:'Inter-Regular',Helvetica]">
              Join thousands of successful learners who transformed their
              careers with us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white rounded-2xl shadow-lg border-0"
              >
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <Avatar className="w-16 h-16">
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                      />
                      <AvatarFallback>
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-base [font-family:'Inter-SemiBold',Helvetica]">
                        {testimonial.name}
                      </h4>
                      <p className="text-gray-600 text-base [font-family:'Inter-Regular',Helvetica]">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  <blockquote className="text-gray-700 text-base leading-normal mb-6 [font-family:'Inter-Regular',Helvetica]">
                    "{testimonial.testimonial}"
                  </blockquote>

                  <img
                    src={testimonial.rating}
                    alt="Rating"
                    className="w-80 h-6"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-sky-500 to-cyan-500 py-16">
        <div className="max-w-4xl mx-auto px-20 text-center">
          <h2 className="text-4xl font-bold text-white mb-4 [font-family:'Inter-Bold',Helvetica]">
            Ready to Transform Your Future?
          </h2>
          <p className="text-xl text-blue-100 mb-8 [font-family:'Inter-Regular',Helvetica]">
            Join thousands of learners who are already building successful
            careers with Time4Education.
          </p>
          <Button className="bg-white text-sky-500 hover:bg-gray-50 px-10 py-4 h-[60px] rounded-xl shadow-lg text-lg font-semibold [font-family:'Inter-SemiBold',Helvetica]">
            Start Learning Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
