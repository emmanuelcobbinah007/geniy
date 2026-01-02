"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, GripVertical, Trash2, GitBranch, ArrowRight } from "lucide-react"
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SurveyEditorProps {
  questions: any[];
  setQuestions: (questions: any[]) => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
}

function SortableQuestionCard({ 
  q, 
  questions,
  updateQuestion,
  addOption,
  updateOption,
  removeOption,
  addLogic,
  removeLogic,
  deleteQuestion
}: {
  q: any;
  questions: any[];
  updateQuestion: (id: number, field: string, value: any) => void;
  addOption: (qId: number) => void;
  updateOption: (qId: number, index: number, value: string) => void;
  removeOption: (qId: number, index: number) => void;
  addLogic: (qId: number) => void;
  removeLogic: (qId: number, index: number) => void;
  deleteQuestion: (id: number) => void;
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item value={q} style={{ listStyle: "none" }} dragListener={false} dragControls={controls}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="group relative"
      >
        {/* Desktop Handle */}
        <div 
            className="absolute left-0 top-6 -translate-x-full pr-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => controls.start(e)}
        >
          <div className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            <GripVertical className="w-5 h-5" />
          </div>
        </div>

        {/* Mobile Handle (Top Right Overlay) */}
        <div 
            className="absolute right-2 top-2 z-10 md:hidden p-2 text-zinc-300 touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => controls.start(e)}
        >
            <GripVertical className="w-5 h-5" />
        </div>
        
        <Card className={cn(
          "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-4 md:p-6 transition-all duration-200",
          "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
          "focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20"
        )}>
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4">
              <Input 
                className="bg-transparent border-none text-xl font-medium text-foreground placeholder:text-zinc-400 px-0 focus-visible:ring-0 h-auto pr-8 md:pr-0"
                placeholder="Type your question here..."
                value={q.title}
                onChange={(e) => updateQuestion(q.id, "title", e.target.value)}
              />
              
              {/* Options Area (if applicable) */}
              {(q.type === "multiple_choice" || q.type === "checkbox") && (
                <div className="space-y-2 pl-1">
                  {q.options?.map((opt: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 group/opt">
                      {/* Circle for multiple_choice, Square for checkbox */}
                      {q.type === "checkbox" ? (
                        <div className="w-4 h-4 rounded-sm border border-zinc-300 dark:border-zinc-700" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700" />
                      )}
                      <Input 
                        className="h-8 bg-transparent border-none text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 px-2 focus-visible:ring-0 focus:bg-zinc-100 dark:focus:bg-zinc-950/50 rounded"
                        value={opt}
                        onChange={(e) => updateOption(q.id, i, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover/opt:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                        onClick={() => removeOption(q.id, i)}
                      >
                          <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div 
                    className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => addOption(q.id)}
                  >
                    {q.type === "checkbox" ? (
                      <div className="w-4 h-4 rounded-sm border border-zinc-300 dark:border-zinc-700 border-dashed" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 border-dashed" />
                    )}
                    <span className="text-sm text-zinc-500 px-2">Add option</span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4 pt-2 flex-wrap">
                <Select 
                    value={q.type || "text"}
                    onValueChange={(val) => updateQuestion(q.id, "type", val)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Short Text</SelectItem>
                    <SelectItem value="long_text">Long Text</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="checkbox">Checkbox (Multi-select)</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
                
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id={`req-${q.id}`} 
                    className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-violet-600 focus:ring-violet-600 focus:ring-offset-white dark:focus:ring-offset-zinc-950" 
                    checked={q.required} 
                    onChange={(e) => updateQuestion(q.id, "required", e.target.checked)}
                  />
                  <label htmlFor={`req-${q.id}`} className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer transition-colors">Required</label>
                </div>

                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10"
                  onClick={() => addLogic(q.id)}
                >
                  <GitBranch className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-xs">Logic</span>
                </Button>
              </div>

              {/* Logic Section */}
              {q.logic && q.logic.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/50 space-y-2"
                >
                  {q.logic.map((rule: any, i: number) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/50 p-3 md:p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/50 group/logic relative">
                      
                      {/* Condition Group */}
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <GitBranch className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        {(q.type === "multiple_choice" || q.type === "checkbox") ? (
                          <>
                            <span className="shrink-0">If answer is</span>
                            <Select 
                              value={rule.if as string} 
                              onValueChange={(val) => {
                                  const newLogic = [...q.logic]
                                  newLogic[i].if = val
                                  updateQuestion(q.id, "logic", newLogic)
                              }}
                            >
                              <SelectTrigger className="flex-1 md:w-[140px] h-7 text-xs border-none bg-transparent p-0 focus:ring-0 shadow-none hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 px-2 rounded-md transition-colors">
                                <SelectValue placeholder="Select option..." />
                              </SelectTrigger>
                              <SelectContent>
                                {q.options?.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </>
                        ) : (
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">After answering</span>
                        )}
                      </div>

                      {/* Action Group */}
                      <div className="flex items-center gap-2 w-full md:w-auto pl-5 md:pl-0">
                        <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="shrink-0">jump to</span>
                        <Select
                          value={rule.then}
                          onValueChange={(val) => {
                              const newLogic = [...q.logic]
                              newLogic[i].then = val
                              updateQuestion(q.id, "logic", newLogic)
                          }}
                        >
                          <SelectTrigger className="flex-1 md:w-[140px] h-7 text-xs border-none bg-transparent p-0 focus:ring-0 shadow-none hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 px-2 rounded-md transition-colors">
                            <SelectValue placeholder="Select question..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="end">End of Survey</SelectItem>
                            {questions.filter(targetQ => targetQ.id !== q.id).map(targetQ => (
                              <SelectItem key={targetQ.id} value={targetQ.id.toString()}>
                                {targetQ.id}. {targetQ.title || "Untitled"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 md:static h-6 w-6 md:ml-auto opacity-100 md:opacity-0 group-hover/logic:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                        onClick={() => removeLogic(q.id, i)}
                      >
                          <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteQuestion(q.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </Reorder.Item>
  )
}

export function SurveyEditor({ 
  questions, 
  setQuestions, 
  title, 
  setTitle, 
  description, 
  setDescription 
}: SurveyEditorProps) {

  const addLogic = (qId: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const defaultIf = (q.type === "multiple_choice" || q.type === "checkbox") ? "" : true
        return { ...q, logic: [...(q.logic || []), { if: defaultIf, then: "" }] }
      }
      return q
    }))
  }

  const removeLogic = (qId: number, index: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newLogic = [...(q.logic || [])]
        newLogic.splice(index, 1)
        return { ...q, logic: newLogic }
      }
      return q
    }))
  }

  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const updateQuestion = (id: number, field: string, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        return { ...q, [field]: value }
      }
      return q
    }))
  }

  const addOption = (qId: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] }
      }
      return q
    }))
  }

  const updateOption = (qId: number, index: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...(q.options || [])]
        newOptions[index] = value
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const removeOption = (qId: number, index: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...(q.options || [])]
        newOptions.splice(index, 1)
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 min-h-full overflow-x-hidden">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Survey Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group"
        >
          <div className="p-4 md:p-8 rounded-2xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-transparent hover:border-zinc-300 dark:hover:border-zinc-800 transition-all shadow-sm dark:shadow-none">
            <Input 
              className="text-4xl md:text-5xl font-bold font-display bg-transparent border-none px-0 h-auto placeholder:text-zinc-400 focus-visible:ring-0 text-foreground" 
              placeholder="Survey Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea 
              className="mt-4 text-xl text-zinc-600 dark:text-zinc-300 bg-transparent border-none px-0 resize-none min-h-[60px] focus-visible:ring-0 placeholder:text-zinc-400 leading-relaxed"
              placeholder="Describe what this survey is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Question List */}
        <div className="space-y-6">
          <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-6">
            <AnimatePresence>
              {questions.map((q) => (
                <SortableQuestionCard 
                    key={q.id}
                    q={q}
                    questions={questions}
                    updateQuestion={updateQuestion}
                    addOption={addOption}
                    updateOption={updateOption}
                    removeOption={removeOption}
                    addLogic={addLogic}
                    removeLogic={removeLogic}
                    deleteQuestion={deleteQuestion}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </div>

        {/* Add Question Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center py-8"
        >
          <Button 
            variant="ghost" 
            className="text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
            onClick={() => {
              const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1
              setQuestions([...questions, { id: newId, type: "text", title: "", required: false, options: [], logic: [] }])
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Question
          </Button>
        </motion.div>

      </div>
    </div>
  )
}
