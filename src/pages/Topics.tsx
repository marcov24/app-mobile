import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useClient } from '@/hooks/useClient';
import { getActiveTopics, getClientByCode } from '../utils/api';
import { ListSkeleton } from '../components/Skeletons';
import { Radio, ArrowLeft, Copy, CheckCheck, Activity, Bell, Info } from 'lucide-react';
import { useToast, ToastContainer } from '@/components/ui/toast';
import PullToRefresh from '../components/PullToRefresh';

export default function Topics() {
  const history = useHistory();
  const { clientCode } = useClient();
  const [clientName, setClientName] = useState<string>('');
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedTopic, setCopiedTopic] = useState<string | null>(null);
  const { toasts, success: showSuccess, remove: removeToast } = useToast();

  useEffect(() => {
    if (clientCode) {
      loadTopics();
      // Refresh topics every 30 seconds
      const interval = setInterval(loadTopics, 30000);
      return () => clearInterval(interval);
    }
  }, [clientCode]);

  const loadTopics = async () => {
    if (!clientCode) return;

    try {
      setLoading(true);
      const [response, clientRes] = await Promise.all([
        getActiveTopics(clientCode),
        getClientByCode(clientCode)
      ]);
      setTopics(response.data.topics || []);
      setClientName(clientRes.data.name);
    } catch (error) {
      console.error('Error loading topics:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ListSkeleton count={4} />;
  }

  return (
    <PullToRefresh onRefresh={loadTopics}>
    <div className="space-y-4 flex flex-col h-full w-full">
      {/* Header - Full Width */}
      <div className="w-screen bg-background relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        {clientCode && (
          <div className="w-full flex items-center gap-2 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-2 pb-3 border-b border-border">
            <button
              onClick={() => history.push('/config')}
              className="p-1 -ml-1 rounded-lg text-[#3eaa76] hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
              title="Volver a los clientes"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-[#3eaa76] capitalize">
              {clientName || clientCode}
            </h1>
          </div>
        )}

        <div className="w-full flex flex-col px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-3 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white leading-none">
              Tópicos MQTT
            </h2>
            {/* <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3eaa76]"></span>
              </span>
              <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest leading-none mt-px">Activos</span>
            </div> */}
          </div>
          <div className="inline-flex items-start sm:items-center gap-2 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800/50 w-fit max-w-full">
            <Info className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 opacity-80" />
            <p className="text-[13px] font-medium leading-snug">
              Mostrando señales remotas con datos recibidos en los <strong className="font-extrabold">últimos 5 minutos</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Tarjetas en lugar de la tabla */}
      <div className="space-y-3 pb-6">
        {topics.length > 0 ? (
          topics.map((topic, _index) => {
            const parts = topic.split('/').map((p) => p.trim()).filter(Boolean);
            const lastPart = parts.length > 0 ? parts[parts.length - 1] : '';
            const secondToLast = parts.length > 1 ? parts[parts.length - 2] : '';
            const contextParts = parts.length > 2 ? parts.slice(0, parts.length - 2) : [];
            
            // Determinar ícono y color según el tópico
            const isAlarm = topic.toLowerCase().includes('alarma');
            const Icon = isAlarm ? Bell : Activity;
            const iconColor = isAlarm ? 'text-red-500' : 'text-[#3eaa76]';
            const bgColor = isAlarm ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20';

            return (
              <div 
                key={topic} 
                className="bg-white dark:bg-gray-800 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 dark:border-gray-700/50 overflow-hidden"
              >
                <div className="flex items-start sm:items-center gap-3 p-4 sm:p-5">
                  <div className={`p-3 rounded-full ${bgColor} shrink-0 mt-1 sm:mt-0`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 pr-1">
                    {/* Callouts (Contexto superior limpio tipo breadcrumbs) */}
                    {contextParts.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center mb-0.5">
                        {contextParts.map((p, i) => (
                           <div key={i} className="flex items-center gap-1.5">
                             <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-700/50 dark:text-slate-400 uppercase tracking-widest truncate max-w-[140px] sm:max-w-none">
                               {p}
                             </span>
                             {i < contextParts.length - 1 && <span className="text-slate-300 dark:text-slate-600 font-bold text-[10px]">›</span>}
                           </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Nombre final y Etiqueta (Badge) */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {secondToLast && (
                        <>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${isAlarm ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-50 text-[#0091A0] border border-[#0091A0]/20'}`}>
                            {secondToLast}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600 font-bold text-[12px] -mx-0.5">/</span>
                        </>
                      )}
                       <span className="text-[16px] sm:text-[18px] font-extrabold text-slate-800 dark:text-white lowercase tracking-tight">
                        {lastPart}
                      </span>
                    </div>
                  </div>

                  {/* Acciones: Botón de copiar ghost */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(topic);
                      setCopiedTopic(topic);
                      showSuccess('Tópico copiado', 2000);
                      setTimeout(() => setCopiedTopic(null), 2000);
                    }}
                    className={`shrink-0 flex items-center justify-center p-2.5 sm:px-3 sm:py-2 rounded-full sm:rounded-lg transition-colors active:scale-95 ${
                      copiedTopic === topic 
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800'
                    }`}
                    title="Copiar tópico"
                  >
                    {copiedTopic === topic ? (
                      <>
                        <CheckCheck className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-dashed">
            <Radio className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No hay tópicos activos</p>
            <p className="text-sm mt-2 text-gray-400">
              Los tópicos aparecerán aquí cuando se reciban datos.
            </p>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
    </PullToRefresh>
  );
}
