# The evaluation imports the paper's protocol instead of copying it, so the paper folder is a second build context:
#   docker build --build-context paper=stayreco-experiment -t stayreco-recommender:local recommender
FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/* && python -m venv /venv
ENV PATH="/venv/bin:$PATH"
COPY pyproject.toml *.py ./
RUN pip install --no-cache-dir numpy==1.26.4 Cython==3.0.12 setuptools wheel \
    && pip install --no-cache-dir --no-build-isolation .

FROM python:3.11-slim
COPY --from=builder /venv /venv
COPY --from=paper data/__init__.py data/preprocessor.py /paper/data/
COPY --from=paper evaluation/__init__.py evaluation/ranking.py /paper/evaluation/
ENV PYTHONPATH=/paper SURPRISE_DATA_FOLDER=/tmp/stayreco-surprise
USER nobody
ENTRYPOINT ["/venv/bin/python", "-u", "-m", "train"]
