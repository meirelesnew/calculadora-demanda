import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Trash2, Plus, Calculator, FileText, Zap, Settings } from 'lucide-react'
import './App.css'

function App() {
  const [comodos, setComodos] = useState([])
  const [novoComodo, setNovoComodo] = useState({
    nome: '',
    tipo: '',
    area: '',
    perimetro: '',
    tues: []
  })
  const [novaTue, setNovaTue] = useState({ nome: '', potencia: '' })
  
  // Estados para fatores de demanda e potência
  const [fatores, setFatores] = useState({
    fatorDemandaIluminacao: 1.0,
    fatorDemandaTugs: 1.0,
    fatorDemandaTues: 1.0,
    fatorDemandaGeral: 0.7, // Fator de demanda típico para residências
    fatorPotencia: 0.92 // Fator de potência mínimo NBR 5410
  })

  // Função para calcular potência de iluminação
  const calcularIluminacao = (area) => {
    const areaNum = parseFloat(area)
    if (areaNum <= 6) return 100
    const areaAdicional = areaNum - 6
    const incrementos = Math.floor(areaAdicional / 4)
    return 100 + (incrementos * 60)
  }

  // Função para calcular número de TUGs
  const calcularTugs = (tipo, perimetro, area) => {
    const perimetroNum = parseFloat(perimetro)
    const areaNum = parseFloat(area)
    
    switch (tipo) {
      case 'banheiro':
        return { quantidade: 1, potenciaUnitaria: 600, potenciaTotal: 600 }
      
      case 'cozinha':
      case 'area-servico':
        const qtdCozinha = Math.ceil(perimetroNum / 3.5)
        const primeiras3 = Math.min(qtdCozinha, 3)
        const demais = Math.max(0, qtdCozinha - 3)
        const potenciaTotal = (primeiras3 * 600) + (demais * 100)
        return { quantidade: qtdCozinha, potenciaUnitaria: 'Variável', potenciaTotal }
      
      case 'varanda':
        return { quantidade: 1, potenciaUnitaria: 100, potenciaTotal: 100 }
      
      case 'sala':
      case 'dormitorio':
        const qtdSalaDorm = Math.ceil(perimetroNum / 5)
        return { quantidade: qtdSalaDorm, potenciaUnitaria: 100, potenciaTotal: qtdSalaDorm * 100 }
      
      default:
        if (areaNum <= 2.25) {
          return { quantidade: 1, potenciaUnitaria: 100, potenciaTotal: 100 }
        } else if (areaNum <= 6) {
          return { quantidade: 1, potenciaUnitaria: 100, potenciaTotal: 100 }
        } else {
          const qtdDemais = Math.ceil(perimetroNum / 5)
          return { quantidade: qtdDemais, potenciaUnitaria: 100, potenciaTotal: qtdDemais * 100 }
        }
    }
  }

  // Função para adicionar TUE
  const adicionarTue = () => {
    if (novaTue.nome && novaTue.potencia) {
      setNovoComodo(prev => ({
        ...prev,
        tues: [...prev.tues, { ...novaTue, potencia: parseFloat(novaTue.potencia) }]
      }))
      setNovaTue({ nome: '', potencia: '' })
    }
  }

  // Função para remover TUE
  const removerTue = (index) => {
    setNovoComodo(prev => ({
      ...prev,
      tues: prev.tues.filter((_, i) => i !== index)
    }))
  }

  // Função para adicionar cômodo
  const adicionarComodo = () => {
    if (novoComodo.nome && novoComodo.tipo && novoComodo.area && novoComodo.perimetro) {
      const iluminacao = calcularIluminacao(novoComodo.area)
      const tugs = calcularTugs(novoComodo.tipo, novoComodo.perimetro, novoComodo.area)
      const potenciaTues = novoComodo.tues.reduce((sum, tue) => sum + tue.potencia, 0)
      
      const comodo = {
        ...novoComodo,
        id: Date.now(),
        area: parseFloat(novoComodo.area),
        perimetro: parseFloat(novoComodo.perimetro),
        iluminacao,
        tugs,
        potenciaTues,
        demandaTotal: iluminacao + tugs.potenciaTotal + potenciaTues
      }
      
      setComodos(prev => [...prev, comodo])
      setNovoComodo({ nome: '', tipo: '', area: '', perimetro: '', tues: [] })
    }
  }

  // Função para remover cômodo
  const removerComodo = (id) => {
    setComodos(prev => prev.filter(comodo => comodo.id !== id))
  }

  // Calcular demandas com fatores aplicados
  const calcularDemandas = () => {
    const demandaIluminacao = comodos.reduce((sum, comodo) => sum + comodo.iluminacao, 0)
    const demandaTugs = comodos.reduce((sum, comodo) => sum + comodo.tugs.potenciaTotal, 0)
    const demandaTues = comodos.reduce((sum, comodo) => sum + comodo.potenciaTues, 0)
    
    // Aplicar fatores de demanda específicos
    const demandaIluminacaoComFator = demandaIluminacao * fatores.fatorDemandaIluminacao
    const demandaTugsComFator = demandaTugs * fatores.fatorDemandaTugs
    const demandaTuesComFator = demandaTues * fatores.fatorDemandaTues
    
    // Demanda total sem fator geral
    const demandaTotalSemFatorGeral = demandaIluminacaoComFator + demandaTugsComFator + demandaTuesComFator
    
    // Aplicar fator de demanda geral
    const demandaTotalComFatorGeral = demandaTotalSemFatorGeral * fatores.fatorDemandaGeral
    
    // Calcular potência ativa (considerando fator de potência)
    const potenciaAtiva = demandaTotalComFatorGeral * fatores.fatorPotencia
    
    return {
      demandaIluminacao,
      demandaTugs,
      demandaTues,
      demandaIluminacaoComFator,
      demandaTugsComFator,
      demandaTuesComFator,
      demandaTotalSemFatorGeral,
      demandaTotalComFatorGeral,
      potenciaAtiva
    }
  }

  const resultados = calcularDemandas()

  const tiposComodo = [
    { value: 'sala', label: 'Sala' },
    { value: 'dormitorio', label: 'Dormitório' },
    { value: 'cozinha', label: 'Cozinha' },
    { value: 'banheiro', label: 'Banheiro' },
    { value: 'area-servico', label: 'Área de Serviço' },
    { value: 'varanda', label: 'Varanda' },
    { value: 'outros', label: 'Outros' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Calculadora de Demanda Energética
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calcule a demanda energética de instalações elétricas residenciais conforme a NBR 5410
          </p>
        </div>

        {/* Configuração de Fatores */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Fatores de Demanda e Potência
            </CardTitle>
            <CardDescription>
              Configure os fatores de demanda e o fator de potência para o cálculo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fator-iluminacao">Fator Demanda Iluminação</Label>
                <Input
                  id="fator-iluminacao"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={fatores.fatorDemandaIluminacao}
                  onChange={(e) => setFatores(prev => ({ ...prev, fatorDemandaIluminacao: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fator-tugs">Fator Demanda TUGs</Label>
                <Input
                  id="fator-tugs"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={fatores.fatorDemandaTugs}
                  onChange={(e) => setFatores(prev => ({ ...prev, fatorDemandaTugs: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fator-tues">Fator Demanda TUEs</Label>
                <Input
                  id="fator-tues"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={fatores.fatorDemandaTues}
                  onChange={(e) => setFatores(prev => ({ ...prev, fatorDemandaTues: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fator-geral">Fator Demanda Geral</Label>
                <Input
                  id="fator-geral"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={fatores.fatorDemandaGeral}
                  onChange={(e) => setFatores(prev => ({ ...prev, fatorDemandaGeral: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fator-potencia">Fator de Potência</Label>
                <Input
                  id="fator-potencia"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={fatores.fatorPotencia}
                  onChange={(e) => setFatores(prev => ({ ...prev, fatorPotencia: parseFloat(e.target.value) || 0.92 }))}
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Dica:</strong> O fator de demanda geral típico para residências é 0,7. 
                O fator de potência mínimo conforme NBR 5410 é 0,92.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Adição de Cômodo */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Cômodo
            </CardTitle>
            <CardDescription>
              Insira os dados do cômodo para calcular a demanda energética
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Cômodo</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Sala, Quarto 1"
                  value={novoComodo.nome}
                  onChange={(e) => setNovoComodo(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={novoComodo.tipo} onValueChange={(value) => setNovoComodo(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposComodo.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={novoComodo.area}
                  onChange={(e) => setNovoComodo(prev => ({ ...prev, area: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perimetro">Perímetro (m)</Label>
                <Input
                  id="perimetro"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={novoComodo.perimetro}
                  onChange={(e) => setNovoComodo(prev => ({ ...prev, perimetro: e.target.value }))}
                />
              </div>
            </div>

            {/* Seção TUEs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Tomadas de Uso Específico (TUEs)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tue-nome">Nome do Equipamento</Label>
                  <Input
                    id="tue-nome"
                    placeholder="Ex: Torneira Elétrica"
                    value={novaTue.nome}
                    onChange={(e) => setNovaTue(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tue-potencia">Potência (W)</Label>
                  <Input
                    id="tue-potencia"
                    type="number"
                    placeholder="0"
                    value={novaTue.potencia}
                    onChange={(e) => setNovaTue(prev => ({ ...prev, potencia: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={adicionarTue} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar TUE
                  </Button>
                </div>
              </div>

              {novoComodo.tues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">TUEs Adicionadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {novoComodo.tues.map((tue, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-2">
                        {tue.nome} - {tue.potencia} W
                        <button
                          onClick={() => removerTue(index)}
                          className="ml-1 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={adicionarComodo} className="w-full" size="lg">
              <Calculator className="h-5 w-5 mr-2" />
              Calcular e Adicionar Cômodo
            </Button>
          </CardContent>
        </Card>

        {/* Tabela de Resultados */}
        {comodos.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Resultados do Cálculo</CardTitle>
              <CardDescription>
                Demanda energética calculada conforme NBR 5410
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cômodo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Área (m²)</TableHead>
                      <TableHead>Perímetro (m)</TableHead>
                      <TableHead>Iluminação (VA)</TableHead>
                      <TableHead>TUGs (VA)</TableHead>
                      <TableHead>TUEs (W)</TableHead>
                      <TableHead>Total (VA)</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comodos.map((comodo) => (
                      <TableRow key={comodo.id}>
                        <TableCell className="font-medium">{comodo.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tiposComodo.find(t => t.value === comodo.tipo)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{comodo.area}</TableCell>
                        <TableCell>{comodo.perimetro}</TableCell>
                        <TableCell>{comodo.iluminacao}</TableCell>
                        <TableCell>{comodo.tugs.potenciaTotal}</TableCell>
                        <TableCell>{comodo.potenciaTues}</TableCell>
                        <TableCell className="font-bold">{comodo.demandaTotal}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removerComodo(comodo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Resumo Total com Fatores */}
              <div className="mt-6 space-y-4">
                <Separator />
                
                {/* Resumo por Tipo de Carga */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Iluminação</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Potência Instalada:</span>
                        <span className="font-medium">{resultados.demandaIluminacao.toFixed(2)} VA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fator de Demanda:</span>
                        <span className="font-medium">{fatores.fatorDemandaIluminacao}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Demanda:</span>
                        <span>{resultados.demandaIluminacaoComFator.toFixed(2)} VA</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">TUGs</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Potência Instalada:</span>
                        <span className="font-medium">{resultados.demandaTugs.toFixed(2)} VA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fator de Demanda:</span>
                        <span className="font-medium">{fatores.fatorDemandaTugs}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Demanda:</span>
                        <span>{resultados.demandaTugsComFator.toFixed(2)} VA</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">TUEs</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Potência Instalada:</span>
                        <span className="font-medium">{resultados.demandaTues.toFixed(2)} VA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fator de Demanda:</span>
                        <span className="font-medium">{fatores.fatorDemandaTues}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Demanda:</span>
                        <span>{resultados.demandaTuesComFator.toFixed(2)} VA</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Resumo Final */}
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Demanda Total da Instalação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Demanda Parcial (sem fator geral):</span>
                          <span className="font-medium">{resultados.demandaTotalSemFatorGeral.toFixed(2)} VA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fator de Demanda Geral:</span>
                          <span className="font-medium">{fatores.fatorDemandaGeral}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Demanda Total (VA):</span>
                          <span>{resultados.demandaTotalComFatorGeral.toFixed(2)} VA</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Fator de Potência:</span>
                          <span className="font-medium">{fatores.fatorPotencia}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Potência Ativa (W):</span>
                          <span>{resultados.potenciaAtiva.toFixed(2)} W</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Demanda (kVA):</span>
                          <span>{(resultados.demandaTotalComFatorGeral / 1000).toFixed(3)} kVA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-blue-100 mt-4">
                    Valores calculados conforme NBR 5410 - Instalações Elétricas de Baixa Tensão
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App
