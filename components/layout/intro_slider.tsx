/* eslint-disable @next/next/no-img-element */
'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog"
import { useCallback, useEffect, useState } from "react"
import { versionData } from "./logo"

export default function IntroSlider() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [isFinished, setIsFinished] = useState(false)


  useEffect(() => {
    setOpen(versionData.introVersion != localStorage.getItem('introVersion'))
  }, [])

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      const newCurrent = api.selectedScrollSnap() + 1
      setCurrent(newCurrent)
      if (newCurrent === count) {
        setIsFinished(true)
      }
    })
  }, [api, count])

  const handleClose = useCallback(() => {
    if (isFinished) {
      setOpen(false)
      localStorage.setItem('introVersion', versionData.introVersion)
    }
  }, [isFinished])

  const handleSkip = useCallback(() => {
    setOpen(false)
    localStorage.setItem('introVersion', versionData.introVersion)
  }, [])

  const slides = [
    {
      title: "Have a Business Idea Which Needs AI?",
      content: "You've come to the right place. Our platform is designed to help you seamlessly integrate AI into your business model, providing you with the tools and support you need to succeed.",
      image: "/bulb.svg",
    },
    {
      title: "Discover LLM Flow",
      content: "LLM Flow is a web application that enables you to test and refine your AI workflows without any coding. It also helps to create proof of concept from flow charts, making it easier to visualize and iterate on your ideas.",
      image: "/idea.svg",
    },
    {
      title: "Create Your First Node",
      content: "Imagine crafting a poem writer that composes a short poem about flowers and translates it into German. With our intuitive interface, you can easily build and customize nodes to suit your specific needs.",
      image: "/create_a_node.gif",
    },
    {
      title: "Define Your Instructions",
      content: "Choose the model, set your system prompt and user prompts. Our platform supports a variety of models, allowing you to tailor your AI's behavior to achieve the best results.",
      image: "/instructions.gif",
    },
    {
      title: "Build Your Flow",
      content: "Add the translator node to your flow. Our drag-and-drop interface makes it simple to connect nodes and create complex workflows with ease.",
      image: "/add_second.gif",
    },
    {
      title: "Configure Your OpenAI Key",
      content: "Currently, we support only OpenAI. We are actively working on expanding our support to include other AI providers in the near future. Stay tuned for updates!",
      image: "/set_key.gif",
    },
    {
      title: "Execute Your Concept",
      content: "Press the Play button to get an insight of your concept in action!",
      image: "/run.gif",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent withoutCloseButton className="max-w-xl">
        <DialogHeader>
          {!isFinished && current != 1 && <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
            >
              Skip
            </Button>
          </div>}
        </DialogHeader>
        <div className="mx-auto max-w-xl">
          <Carousel setApi={setApi} className="w-full max-w-lg">
            <CarouselContent>
              {slides.map((slide, index) => (
                <CarouselItem key={index}>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-72 object-contain mb-4 rounded-md"
                  />
                  <h3 className="text-lg font-semibold mb-1">{slide.title}</h3>
                  <p className="text-sm text-muted-foreground">{slide.content}</p>
                </CarouselItem>
              ))}
              <CarouselItem className="">
                <img
                  src='/list.svg'
                  alt="Benefits"
                  className="w-full h-32 object-contain mb-4 rounded-md"
                />
                <h3 className="text-lg font-semibold mb-1">We Offer!</h3>
                <p className="text-sm text-muted-foreground px-5">
                  <ul className="list-disc">
                    <li>Comprehensive Flow Chart Capabilities</li>
                    <li>LLM Cost Visualization</li>
                    <li>Developer Mode with Test API Functionality</li>
                    <li>Multithreading Support</li>
                    <li>Process Duration Tracking</li>
                    <li>LLM Flow Export & Import Functionality</li>
                    <li>Enhanced Text Editor for Prompt Customization</li>
                    <li>Intuitive Value Selection Tool</li>
                    <li>JavaScript Integration in Statements</li>
                    <li>Advanced JSON Schema Editor</li>
                  </ul>
                </p>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          <div className="flex justify-between mt-4">
            {current != 1 ?
              <Button
                onClick={() => api?.scrollPrev()}
                disabled={current === 1}
                variant="outline"
              >
                Back
              </Button>
              :
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
              >
                Skip
              </Button>
            }
            <Button
              onClick={() => current === count ? handleClose() : api?.scrollNext()}
              variant={current === count ? "default" : "outline"}
            >
              {current === count ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}