from typing import Any, Dict


class PathwayAgent:
    """
    Lightweight pathway adapter used by the API compatibility layer.
    """

    def recommend_next_node(self, learner_state: Dict[str, Any], curriculum_graph: Dict[str, Any]) -> Dict[str, Any]:
        weak_topics = learner_state.get("weak_topics") or learner_state.get("lag_concepts") or []
        if isinstance(curriculum_graph, dict):
            graph_topic = curriculum_graph.get("topic") or curriculum_graph.get("current_topic")
        else:
            graph_topic = None

        next_topic = None
        if weak_topics:
            next_topic = weak_topics[0]
        elif graph_topic:
            next_topic = graph_topic
        else:
            next_topic = "general_revision"

        return {
            "action": "REVIEW" if weak_topics else "CONTINUE",
            "next_topic": next_topic,
            "message": f"Focus next on {next_topic.replace('_', ' ')}.",
        }
