import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Brain, MessageSquare, Calendar, Award, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const Welcome = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: 'Bem-vindo ao EduPais',
      description: 'O assistente que ajuda pais a apoiarem a educação de seus filhos, mesmo sem conhecimento técnico.',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Ajuda com Tarefas',
      description: 'Tire fotos das tarefas escolares ou descreva o problema para receber explicações simples e claras.',
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      title: 'Modo de Estudo',
      description: 'Crie quizzes personalizados para ajudar seu filho a se preparar para provas e avaliações.',
      icon: Brain,
      color: 'bg-purple-500'
    },
    {
      title: 'Chat Educacional',
      description: 'Converse com nosso assistente para tirar dúvidas sobre qualquer matéria escolar.',
      icon: MessageSquare,
      color: 'bg-yellow-500'
    },
    {
      title: 'Rotina de Estudos',
      description: 'Organize a rotina de estudos do seu filho com lembretes e calendário de atividades.',
      icon: Calendar,
      color: 'bg-red-500'
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? prev : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? prev : prev - 1))
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-edu-blue-500 text-white p-1 rounded">
              <BookOpen size={24} />
            </div>
            <span className="font-bold text-xl">EduPais</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="eduBlue">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="relative overflow-hidden rounded-xl bg-white shadow-lg">
            <div 
              className="transition-transform duration-500 ease-in-out flex"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="min-w-full p-8 flex flex-col items-center text-center">
                  <div className={`p-4 rounded-full ${slide.color} text-white mb-6`}>
                    <slide.icon className="h-10 w-10" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">{slide.title}</h2>
                  <p className="text-muted-foreground mb-6">{slide.description}</p>
                  
                  {index === slides.length - 1 && (
                    <Button 
                      variant="eduBlue" 
                      className="w-full mt-4"
                      onClick={() => window.location.href = '/dashboard'}
                    >
                      Começar Agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Controles de navegação */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    currentSlide === index ? 'w-8 bg-edu-blue-500' : 'w-2 bg-gray-300'
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={currentSlide === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Anterior
            </Button>
            
            {currentSlide < slides.length - 1 ? (
              <Button variant="eduBlue" onClick={nextSlide}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="eduBlue" 
                onClick={() => window.location.href = '/dashboard'}
              >
                Começar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <footer className="py-6 text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Award className="h-5 w-5 text-edu-blue-500" />
          <span className="font-bold text-xl">EduPais</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Apoiando pais na jornada educacional de seus filhos
        </p>
      </footer>

      {/* Botão de pular introdução */}
      <div className="absolute top-4 right-4">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/dashboard'}
          className="text-muted-foreground hover:text-foreground"
        >
          Pular
        </Button>
      </div>
    </div>
  )
}

export default Welcome 