import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Send,
  List,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import _ from 'lodash';
import confetti from 'canvas-confetti';
import examData from './data.json';

const STORAGE_KEY = 'exam_state_v1';

const App = () => {
  // State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [reviewMode, setReviewMode] = useState(false);
  const [showReviewList, setShowReviewList] = useState(false);

  // Initialize Exam
  const initExam = useCallback((shouldShuffleQ = true, shouldShuffleO = true) => {
    let preparedQuestions = examData.map(q => ({
      ...q,
      originalOptions: [...q.options]
    }));

    if (shouldShuffleQ) {
      preparedQuestions = _.shuffle(preparedQuestions);
    }

    if (shouldShuffleO) {
      preparedQuestions = preparedQuestions.map(q => ({
        ...q,
        options: _.shuffle(q.options)
      }));
    }

    setQuestions(preparedQuestions);
    setAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setShowExplanation(false);
    setReviewMode(false);
    setShowReviewList(false);

    // Save initial state
    const initialState = {
      questions: preparedQuestions,
      answers: {},
      currentIndex: 0,
      startTime: Date.now(),
      isFinished: false
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  }, []);

  // Load from LocalStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setQuestions(parsed.questions);
        setAnswers(parsed.answers);
        setCurrentIndex(parsed.currentIndex);
        setStartTime(parsed.startTime);
        setIsFinished(parsed.isFinished || false);
      } catch (e) {
        initExam();
      }
    } else {
      initExam();
    }
  }, [initExam]);

  // Persist State
  useEffect(() => {
    if (questions.length > 0) {
      const stateToSave = {
        questions,
        answers,
        currentIndex,
        startTime,
        isFinished
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [questions, answers, currentIndex, startTime, isFinished]);

  // Timer
  useEffect(() => {
    if (!isFinished && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isFinished, startTime]);

  // Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId, optionId) => {
    if (isFinished) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleFinish = () => {
    setIsFinished(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percent: Math.round((correct / questions.length) * 100)
    };
  }, [questions, answers]);

  const currentQuestion = questions[currentIndex];
  const progress = Math.round(((Object.keys(answers).length) / questions.length) * 100);

  if (!currentQuestion) return <div className="flex items-center justify-center h-screen">Carregando...</div>;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* Header */}
      <header className={`sticky top-0 z-10 ${darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200'} backdrop-blur border-b px-4 py-3`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <CheckCircle size={20} />
            </div>
            <h1 className="font-bold text-lg hidden sm:block">Simulado Interativo</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-sm bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">
              <Clock size={14} />
              {formatTime(elapsedTime)}
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={darkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={() => setFocusMode(!focusMode)}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={focusMode ? "Sair do Modo Foco" : "Modo Foco"}
            >
              {focusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        {!focusMode && (
          <div className="max-w-4xl mx-auto mt-3">
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1 text-slate-500">
              <span>{Object.keys(answers).length} de {questions.length} respondidas</span>
              <span>{progress}% concluído</span>
            </div>
          </div>
        )}
      </header>

      <main className={`max-w-4xl mx-auto px-4 py-8 ${focusMode ? 'pt-4' : ''}`}>

        {isFinished ? (
          /* Results View */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-xl p-8 text-center border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h2 className="text-3xl font-bold mb-2">Simulado Concluído!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">Confira seu desempenho detalhado abaixo</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="p-6 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800">
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Acertos</div>
                  <div className="text-4xl font-bold text-indigo-700 dark:text-indigo-300">{score.correct} / {score.total}</div>
                </div>
                <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800">
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Desempenho</div>
                  <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">{score.percent}%</div>
                </div>
                <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800">
                  <div className="text-sm text-amber-600 dark:text-amber-400 font-semibold mb-1">Tempo Total</div>
                  <div className="text-4xl font-bold text-amber-700 dark:text-amber-300">{formatTime(elapsedTime)}</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => { setIsFinished(false); setCurrentIndex(0); setReviewMode(true); }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Eye size={20} />
                  Revisar Respostas
                </button>
                <button
                  onClick={() => {
                    if (confirm("Deseja realmente reiniciar o simulado? Seu progresso atual será perdido.")) {
                      initExam(shuffleQuestions, shuffleOptions);
                    }
                  }}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-semibold flex items-center gap-2 transition-all"
                >
                  <RotateCcw size={20} />
                  Nova Tentativa
                </button>
              </div>
            </div>

            {/* Statistics Section (Optional) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Could add theme performance here if categories were present */}
            </div>
          </div>
        ) : (
          /* Question View */
          <div className="space-y-6">

            {/* Navigation & Question Indicator */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg font-bold">
                  Questão {currentIndex + 1} de {questions.length}
                </span>
                {answers[currentQuestion.id] && !isFinished && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <CheckCircle size={14} /> Respondida
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowReviewList(!showReviewList)}
                className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Ver lista de questões"
              >
                <List size={20} />
              </button>
            </div>

            {/* Review List Popover */}
            {showReviewList && (
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-lg animate-in fade-in zoom-in-95 duration-200`}>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => { setCurrentIndex(idx); setShowReviewList(false); }}
                      className={`h-10 w-full rounded-lg flex items-center justify-center font-semibold transition-all ${
                        currentIndex === idx
                          ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white'
                          : answers[q.id]
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Card */}
            <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-slate-700' : 'border-slate-100'} overflow-hidden`}>

              {/* Question Header/Metadata */}
              {currentQuestion.title && (
                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b dark:border-slate-700">
                  <h3 className="font-bold text-indigo-600 dark:text-indigo-400">{currentQuestion.title}</h3>
                </div>
              )}

              <div className="p-6 sm:p-8 space-y-6">

                {/* Base Text */}
                {currentQuestion.baseText && (
                  <div className={`p-5 rounded-xl border-l-4 border-indigo-400 bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap leading-relaxed`}>
                    {currentQuestion.baseText}
                  </div>
                )}

                {/* Question Image */}
                {currentQuestion.image && (
                  <div className="flex justify-center bg-white p-2 rounded-xl border dark:border-slate-700 group relative">
                    <img
                      src={currentQuestion.image}
                      alt="Question illustration"
                      className="max-h-[400px] object-contain rounded-lg transition-transform duration-300 cursor-zoom-in"
                      onClick={(e) => e.currentTarget.classList.toggle('max-h-none')}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="bg-slate-900/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">Clique para ampliar</span>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <h2 className="text-xl font-semibold leading-snug">
                  {currentQuestion.text}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.id;
                    const isCorrect = option.id === currentQuestion.correctAnswer;
                    const showResult = isFinished || reviewMode;

                    let optionClasses = `w-full p-4 text-left rounded-xl border-2 transition-all flex items-start gap-4 group `;

                    if (showResult) {
                      if (isCorrect) {
                        optionClasses += `bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-900 dark:text-emerald-100`;
                      } else if (isSelected) {
                        optionClasses += `bg-red-50 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-100`;
                      } else {
                        optionClasses += `border-slate-200 dark:border-slate-700 opacity-60`;
                      }
                    } else {
                      if (isSelected) {
                        optionClasses += `bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-900 dark:text-indigo-100 ring-4 ring-indigo-500/10`;
                      } else {
                        optionClasses += `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-700/50`;
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                        disabled={showResult}
                        className={optionClasses}
                      >
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-colors ${
                          showResult
                            ? isCorrect
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : isSelected
                                ? 'bg-red-500 border-red-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 text-slate-400'
                            : isSelected
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 text-slate-500 group-hover:border-indigo-500 group-hover:text-indigo-500'
                        }`}>
                          {option.id.toUpperCase()}
                        </div>
                        <span className="flex-grow font-medium">{option.text}</span>
                        {showResult && isCorrect && <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />}
                        {showResult && isSelected && !isCorrect && <XCircle className="text-red-500 flex-shrink-0" size={20} />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {(isFinished || reviewMode || showExplanation) && (
                  <div className={`animate-in fade-in slide-in-from-top-4 duration-300 p-6 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-indigo-50 border-indigo-100'}`}>
                    <div className="flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-400">
                      <HelpCircle size={20} />
                      <h4 className="font-bold">Gabarito Comentado</h4>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Próxima"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="flex gap-3">
                {reviewMode ? (
                   <button
                    onClick={() => { setIsFinished(true); setReviewMode(false); }}
                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold transition-all"
                  >
                    Voltar aos Resultados
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className={`px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                        showExplanation
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {showExplanation ? <EyeOff size={20} /> : <Eye size={20} />}
                      <span className="hidden sm:inline">{showExplanation ? "Ocultar Explicação" : "Ver Explicação"}</span>
                    </button>

                    {currentIndex === questions.length - 1 ? (
                      <button
                        onClick={handleFinish}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <Send size={20} />
                        Finalizar Prova
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        Continuar
                        <ChevronRight size={20} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Warning if not all answered */}
            {currentIndex === questions.length - 1 && Object.keys(answers).length < questions.length && !isFinished && !reviewMode && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Você ainda não respondeu todas as questões. Recomendamos revisar antes de finalizar.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Info */}
      {!focusMode && !isFinished && (
        <footer className="max-w-4xl mx-auto px-4 py-8 border-t dark:border-slate-800 mt-12 text-slate-500 text-sm flex flex-wrap justify-between gap-4">
          <div>© Editora Edital Master - Simulado de Português</div>
          <div className="flex gap-4">
            <span>{questions.length} questões</span>
            <span>Salvamento Automático Ativo</span>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
