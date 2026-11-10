"""
TF-IDF + Logistic Regression transaction categorizer.
Trains on user's labeled transactions and predicts categories
for new ones. Falls back gracefully when too few samples.
"""
from __future__ import annotations
import logging
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

MIN_SAMPLES = 20


class TransactionCategorizer:
    def __init__(self):
        self._vectorizer = None
        self._clf = None
        self._label_map: dict[int, str] = {}
        self._trained = False

    def train(self, descriptions: list[str], category_ids: list[int]) -> bool:
        if len(descriptions) < MIN_SAMPLES:
            return False
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.linear_model import LogisticRegression

            self._vectorizer = TfidfVectorizer(max_features=2000, ngram_range=(1, 2), lowercase=True)
            X = self._vectorizer.fit_transform(descriptions)

            self._clf = LogisticRegression(max_iter=500, C=1.0)
            self._clf.fit(X, category_ids)
            self._trained = True
            logger.info("Categorizer trained on %d samples", len(descriptions))
            return True
        except Exception as e:
            logger.warning("Categorizer training failed: %s", e)
            return False

    def predict(self, description: str) -> Optional[tuple[int, float]]:
        """Return (category_id, confidence) or None if not trained / low confidence."""
        if not self._trained or self._vectorizer is None or self._clf is None:
            return None
        try:
            X = self._vectorizer.transform([description])
            proba = self._clf.predict_proba(X)[0]
            best_idx = int(np.argmax(proba))
            confidence = float(proba[best_idx])
            if confidence < 0.5:
                return None
            category_id = int(self._clf.classes_[best_idx])
            return category_id, confidence
        except Exception as e:
            logger.warning("Categorizer predict failed: %s", e)
            return None


# Module-level singleton — retrained per user session
_categorizer = TransactionCategorizer()


def get_categorizer() -> TransactionCategorizer:
    return _categorizer
