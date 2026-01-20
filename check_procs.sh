#!/bin/bash
# Save as: /usr/local/bin/check_procs.sh

while read line; do
  echo "Process event: $line"
  
  # Parse the event
  HEADERS=$(echo "$line" | head -n1)
  PROCESS=$(echo "$HEADERS" | grep -oP 'processname:\K\w+')
  
  if [[ "$PROCESS" == "whisper_backend" ]] || [[ "$PROCESS" == "express_backend" ]]; then
    echo "Critical process $PROCESS exited! Restarting..."
    supervisorctl restart "$PROCESS"
  fi
  
  # Acknowledge the event
  echo "RESULT 2"
  echo "OK"
done < /dev/stdin