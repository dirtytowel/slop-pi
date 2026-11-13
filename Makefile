SRC := $(HOME)/.pi/agent
DIRS := extensions skills themes

.PHONY: sync
sync:
	@for d in $(DIRS); do rm -rf $$d && cp -r $(SRC)/$$d $$d; done
