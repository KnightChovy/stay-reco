#!/bin/bash
# Chuoi chay qua dem cho ablation hai phia. Chay NOI TIEP, khong song song
# (lan truoc chay song song lam TripAdvisor cham gap 3).
cd /d/stayreco-experiment
export PYTHONIOENCODING=utf-8 PYTHONUNBUFFERED=1
SEEDS="1 2 3 4 5 6 7 8 9 10"

echo "[$(date +%H:%M:%S)] BAT DAU MovieLens"
conda run --no-capture-output -n stayreco python run_experiment.py $SEEDS \
    --tag=ablation_ml > ablation_ml.log 2>&1
echo "[$(date +%H:%M:%S)] XONG MovieLens, exit=$?"

echo "[$(date +%H:%M:%S)] BAT DAU TripAdvisor"
conda run --no-capture-output -n stayreco python run_experiment.py $SEEDS \
    --dataset=tripadvisor --max-eval-users=2000 --tag=ablation_ta > ablation_ta.log 2>&1
echo "[$(date +%H:%M:%S)] XONG TripAdvisor, exit=$?"

# Buoc HotelRec duoc them sau (neu file ton tai luc den luot thi chay)
if [ -f experiments/run_hotelrec_step.sh ]; then
    echo "[$(date +%H:%M:%S)] BAT DAU HotelRec"
    bash experiments/run_hotelrec_step.sh
    echo "[$(date +%H:%M:%S)] XONG HotelRec, exit=$?"
else
    echo "[$(date +%H:%M:%S)] Khong co buoc HotelRec, dung."
fi
