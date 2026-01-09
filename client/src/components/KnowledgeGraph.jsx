import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import API from '../api';
import { Loader } from 'lucide-react';

const KnowledgeGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ w: 800, h: 500 });
  const containerRef = useRef(null);
  const graphRef = useRef();

  useEffect(() => {
    // 1. Fetch Data
    const fetchData = async () => {
      try {
        const { data } = await API.get('/study/graph');
        
        // Remove duplicate nodes (just in case DB has weird data)
        const uniqueNodes = Array.from(new Map(data.nodes.map(node => [node.id, node])).values());
        setGraphData({ nodes: uniqueNodes, links: data.links });
      } catch (error) {
        console.error("Failed to load graph", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // 2. Handle Resize (Responsive)
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial size check
    setTimeout(handleResize, 100); 

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-400"><Loader className="animate-spin" /></div>;

  if (graphData.nodes.length === 0) return <div className="h-64 flex items-center justify-center text-gray-400">Add cards to see your knowledge map!</div>;

  return (
    <div ref={containerRef} className="w-full h-[500px] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm relative">
      
      {/* Legend Overlay */}
      <div className="absolute top-4 left-4 bg-white/80 dark:bg-black/50 p-2 rounded-lg text-xs backdrop-blur-sm z-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Topic</div>
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Mastered</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400"></span> New</div>
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.w}
        height={dimensions.h}
        
        // Physics
        cooldownTicks={100}
        d3VelocityDecay={0.2} // Higher = Less bouncy
        
        // Nodes
        nodeLabel="name"
        nodeColor={node => node.color}
        nodeVal={node => node.val} // Size based on stability
        nodeRelSize={6}
        
        // Links
        linkColor={() => '#e5e7eb'} // Light gray lines
        linkWidth={1}
        
        // Interaction
        onNodeClick={node => {
          graphRef.current.centerAt(node.x, node.y, 1000);
          graphRef.current.zoom(6, 2000);
        }}
        
        // Dark mode support for background
        backgroundColor="rgba(0,0,0,0)" 
      />
    </div>
  );
};

export default KnowledgeGraph;