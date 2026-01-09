import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import API from '../api';
import { X, Loader, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

const SubjectVisualizer = ({ subjectId, onClose }) => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  
  // Interaction State
  const [hoverNode, setHoverNode] = useState(null); 
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Spot Study State
  const [selectedCard, setSelectedCard] = useState(null); 
  const [isFlipped, setIsFlipped] = useState(false);
  
  const graphRef = useRef();

  useEffect(() => {
    fetchGraph();
    // Handle Orientation Change / Resize
    const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [subjectId]);

  const fetchGraph = () => {
    API.get(`/study/graph/${subjectId}`).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast.error("Failed to load graph data");
      setLoading(false);
    });
  };

  // --- HELPER: WRAP TEXT ---
  const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight) => {
    if(!text) return;
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    const maxLines = 4;
    const renderLines = lines.slice(0, maxLines);
    if(lines.length > maxLines) renderLines[maxLines-1] += '...';
    let startY = y; 
    renderLines.forEach((l, i) => {
      ctx.fillText(l.trim(), x, startY + (i * lineHeight));
    });
  };

  // --- 1. VISUAL PAINTER ---
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHovered = node === hoverNode; 

    // A. HUB (Subject)
    if (node.type === 'HUB') {
      const radius = 18;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.shadowBlur = 0;

      if (globalScale > 0.8) {
        ctx.font = 'bold 5px Sans-Serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        drawWrappedText(ctx, node.name, node.x, node.y - 3, radius * 1.8, 6); 
      }
      return;
    }

    // B. TOPIC
    if (node.type === 'TOPIC') {
      const radius = 10;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#6366f1';
      ctx.fill();

      if (globalScale > 1.2) {
        ctx.font = '3.5px Sans-Serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e0e7ff';
        drawWrappedText(ctx, node.name, node.x, node.y - 2, radius * 1.8, 4.5);
      }
      return;
    }

    // C. CARD (The Pokemon Card)
    const scale = isHovered ? 1.2 : 1; 
    const w = 32 * scale; 
    const h = 42 * scale;
    const x = node.x - w / 2;
    const y = node.y - h / 2;
    const r = 3;

    // Glow Effect (Only visible on Desktop Hover)
    if (isHovered) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 20; 
    } else {
        ctx.shadowBlur = 0;
    }

    // Base
    ctx.fillStyle = '#1e293b'; 
    ctx.strokeStyle = node.color; 
    ctx.lineWidth = isHovered ? 2 : 1; 
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.stroke();

    // Color Header
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 6 * scale, [r, r, 0, 0]); 
    ctx.fill();

    // Content
    if (globalScale > 1.8 || isHovered) {
      ctx.shadowBlur = 0; 
      
      ctx.font = `bold ${3 * scale}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(node.state === 'REVIEW' ? 'ACTIVE' : 'NEW', node.x, node.y - (h/2) + (4.5 * scale));

      ctx.font = `${3 * scale}px Sans-Serif`;
      ctx.fillStyle = 'white';
      drawWrappedText(ctx, node.name, node.x, node.y - (h/2) + (10 * scale), w - 4, 3.5 * scale);

      ctx.font = `${2.5 * scale}px Monospace`;
      ctx.fillStyle = '#94a3b8';
      const stats = `HP:${node.stability} | DF:${node.difficulty}`;
      ctx.fillText(stats, node.x, node.y + (h/2) - (2 * scale));
    }

  }, [hoverNode]);

  // --- 2. RAYCASTING HELPERS ---
  const raycast = (event) => {
      // Handle both Mouse and Touch events
      let clientX, clientY;
      if (event.changedTouches && event.changedTouches.length > 0) {
          clientX = event.changedTouches[0].clientX;
          clientY = event.changedTouches[0].clientY;
      } else {
          clientX = event.clientX;
          clientY = event.clientY;
      }

      const coords = graphRef.current.screen2GraphCoords(clientX, clientY);
      
      // 👇 MOBILE FIX: Increased hit radius from 20 to 30 for thumbs
      const clickRadius = 30; 
      
      return data.nodes.find(node => {
          const dist = Math.sqrt(Math.pow(node.x - coords.x, 2) + Math.pow(node.y - coords.y, 2));
          return dist < clickRadius;
      });
  };

  const handleCanvasClick = (event) => {
      const clickedNode = raycast(event);
      if (clickedNode) {
          if (clickedNode.type === 'CARD') {
              setSelectedCard(clickedNode);
              setIsFlipped(false);
          } else {
              graphRef.current.centerAt(clickedNode.x, clickedNode.y, 1000);
              graphRef.current.zoom(6, 2000);
          }
      }
  };

  const handleCanvasHover = (event) => {
      // Skip hover logic on touch devices to save performance
      if (event.type === 'touchmove') return;

      const hoveredNode = raycast(event);
      if (hoveredNode !== hoverNode) {
          setHoverNode(hoveredNode || null);
          document.body.style.cursor = hoveredNode ? 'pointer' : 'default';
      }
  };

  // --- REVIEW HANDLER ---
  const handleRate = async (rating) => {
    if (!selectedCard) return;
    try {
        const dbId = selectedCard.id.replace('card-', '');
        const { data } = await API.post('/study/review', {
            cardId: dbId,
            rating: rating,
            durationMs: 5000 
        });
        toast.success(`Rated ${rating}`);
        
        const updatedNodes = data.updates; 
        setData(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => {
                if (n.id === selectedCard.id) {
                    return {
                        ...n,
                        stability: Math.round(updatedNodes.stability),
                        difficulty: Math.round(updatedNodes.difficulty),
                        state: updatedNodes.state,
                        color: updatedNodes.stability > 20 ? '#10b981' : '#3b82f6' 
                    };
                }
                return n;
            })
        }));
        setSelectedCard(null);
    } catch (error) {
        console.error(error);
        toast.error("Failed to save review");
    }
  };

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"><Loader className="animate-spin text-white" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="relative w-full h-full"
        onClick={handleCanvasClick} 
        onMouseMove={handleCanvasHover}
      >
        <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition">
            <X size={32} />
        </button>

        <ForceGraph2D
            ref={graphRef}
            graphData={data}
            width={dimensions.w}
            height={dimensions.h}
            nodeCanvasObject={paintNode}
            backgroundColor="#0f172a"
            enableNodeDrag={false} 
            
            // Physics
            d3VelocityDecay={0.1}
            d3AlphaDecay={0.02}
            linkColor={() => '#334155'}
            linkWidth={link => link.value} 
            minZoom={0.5}
            maxZoom={8}
        />
        
        <div className="absolute bottom-10 left-10 text-white/50 text-sm pointer-events-none">
            <p>Tap a Card to Spot Study • Drag to Explore</p>
        </div>
      </div>

      {/* MOBILE RESPONSIVE MODAL */}
      {selectedCard && (
        <div 
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={(e) => e.stopPropagation()} 
        >
            <div className="
                w-[90%] md:w-full max-w-md 
                max-h-[80vh] overflow-y-auto 
                bg-white dark:bg-gray-800 
                rounded-2xl shadow-2xl 
                border border-gray-700 
                animate-in zoom-in duration-200
                flex flex-col
            ">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                    <span className="text-sm font-mono text-gray-500">
                        HP: {Math.round(selectedCard.stability)} | DF: {Math.round(selectedCard.difficulty)}
                    </span>
                    <button onClick={() => setSelectedCard(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>

                {/* Card Content */}
                <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer relative min-h-[250px]" onClick={() => setIsFlipped(!isFlipped)}>
                    <div className="absolute top-0 right-0 text-gray-400 animate-pulse">
                        <RotateCw size={20} />
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-4">
                        {isFlipped ? "Answer" : "Question"}
                    </h3>
                    
                    <div className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed overflow-y-auto max-h-[40vh]">
                         {isFlipped ? (selectedCard.back || "Flip card to see answer...") : selectedCard.name}
                    </div>
                </div>

                {/* Controls - Sticky Bottom */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky bottom-0 z-10">
                    {!isFlipped ? (
                        <button 
                            onClick={() => setIsFlipped(true)}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition active:scale-95"
                        >
                            Flip Card
                        </button>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleRate('AGAIN')} className="p-2 rounded-lg bg-red-100 text-red-700 font-bold text-xs md:text-sm active:bg-red-200">Again</button>
                            <button onClick={() => handleRate('HARD')} className="p-2 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs md:text-sm active:bg-orange-200">Hard</button>
                            <button onClick={() => handleRate('GOOD')} className="p-2 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs md:text-sm active:bg-blue-200">Good</button>
                            <button onClick={() => handleRate('EASY')} className="p-2 rounded-lg bg-green-100 text-green-700 font-bold text-xs md:text-sm active:bg-green-200">Easy</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
      )}

    </div>
  );
};

export default SubjectVisualizer;